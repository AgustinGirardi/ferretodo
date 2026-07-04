import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

const TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  gif: "image/gif",
};

// Sirve las imágenes subidas cuando viven fuera de /public (UPLOADS_DIR apunta
// al disco persistente en producción). En local los archivos de /public/uploads
// se sirven estáticos antes de llegar a esta ruta, así que no interfiere.
export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  // Solo nombres planos generados por el upload (uuid.ext): sin rutas ni "..".
  if (!/^[A-Za-z0-9-]+\.[a-z0-9]+$/.test(name)) {
    return new NextResponse("Not found", { status: 404 });
  }
  const type = TYPES[name.split(".").pop() ?? ""];
  if (!type) return new NextResponse("Not found", { status: 404 });

  const dir = process.env.UPLOADS_DIR || path.join(process.cwd(), "public", "uploads");
  try {
    const data = await readFile(path.join(dir, name));
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": type,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
