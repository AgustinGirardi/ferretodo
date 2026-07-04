import path from "node:path";
import { readFile } from "node:fs/promises";
import { getAdminSession } from "@/lib/auth";
import { runBackup } from "@/lib/backup";

export const dynamic = "force-dynamic";

/** Genera una copia fresca de la base y la descarga (para guardarla fuera del servidor). */
export async function GET() {
  const session = await getAdminSession();
  if (!session) return new Response("No autorizado", { status: 401 });

  try {
    const file = await runBackup();
    const data = await readFile(file);
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${path.basename(file)}"`,
      },
    });
  } catch (e) {
    console.error("[backup] no se pudo generar la copia:", e);
    return new Response("No se pudo generar la copia de seguridad", { status: 500 });
  }
}
