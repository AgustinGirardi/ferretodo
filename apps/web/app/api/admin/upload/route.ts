import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { getAdminSession } from "@/lib/auth";

export const runtime = "nodejs";

// La extensión se deriva del contenido real del archivo. El `type` que manda el
// navegador es solo una etiqueta: se puede poner "image/png" en cualquier cosa.
// Cada formato se reconoce por su firma en los primeros bytes.
const MAGIC: { ext: string; test: (b: Buffer) => boolean }[] = [
  { ext: "jpg", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { ext: "png", test: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { ext: "gif", test: (b) => b.subarray(0, 6).toString("latin1").match(/^GIF8[79]a$/) !== null },
  // Contenedor RIFF: "RIFF" + tamaño (4 bytes) + "WEBP".
  { ext: "webp", test: (b) => b.subarray(0, 4).toString("latin1") === "RIFF" && b.subarray(8, 12).toString("latin1") === "WEBP" },
  // Contenedor ISO-BMFF: tamaño (4 bytes) + "ftyp" + marca (avif / avis).
  { ext: "avif", test: (b) => b.subarray(4, 8).toString("latin1") === "ftyp" && ["avif", "avis"].includes(b.subarray(8, 12).toString("latin1")) },
];

/** Extensión según los bytes del archivo, o null si no es una imagen conocida. */
function extFromContent(buffer: Buffer): string | null {
  if (buffer.length < 12) return null;
  return MAGIC.find((m) => m.test(buffer))?.ext ?? null;
}

const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No se recibió ninguna imagen" }, { status: 400 });
  }
  // El tamaño se corta antes de leer el archivo a memoria.
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "La imagen supera los 5 MB" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.length > MAX_BYTES) {
    return NextResponse.json({ error: "La imagen supera los 5 MB" }, { status: 400 });
  }
  const ext = extFromContent(buffer);
  if (!ext) {
    return NextResponse.json({ error: "Formato no permitido (usá JPG, PNG o WEBP)" }, { status: 400 });
  }

  const filename = `${randomUUID()}.${ext}`;
  // UPLOADS_DIR permite guardar en un disco persistente en producción (ej. Render).
  const dir = process.env.UPLOADS_DIR || path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), buffer);

  return NextResponse.json({ url: `/uploads/${filename}` });
}
