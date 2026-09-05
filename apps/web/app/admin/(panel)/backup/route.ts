import path from "node:path";
import { readFile } from "node:fs/promises";
import { getAdminSession } from "@/lib/auth";
import { runBackup } from "@/lib/backup";

export const dynamic = "force-dynamic";

/**
 * Genera una copia fresca de la base y la descarga (para guardarla fuera del
 * servidor).
 *
 * Es POST y no GET a propósito: `runBackup()` además de crear la copia rota las
 * viejas conservando 14. Como GET, bastaba con llevar al admin logueado a esta
 * URL catorce veces desde cualquier página para vaciarle el historial de copias
 * (la cookie es SameSite=Lax, que sí viaja en una navegación de primer nivel).
 */
export async function POST() {
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
