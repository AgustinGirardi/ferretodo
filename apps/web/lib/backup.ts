import { mkdir, readdir, unlink } from "node:fs/promises";
import path from "node:path";
import { prisma } from "./prisma";

// Cantidad de copias que se conservan (una por día = dos semanas).
const KEEP = 14;

/** Carpeta de backups: BACKUPS_DIR en producción (disco persistente), prisma/backups en local. */
export function backupsDir(): string {
  return process.env.BACKUPS_DIR || path.join(process.cwd(), "prisma", "backups");
}

/**
 * Crea una copia consistente de la base SQLite usando VACUUM INTO (funciona
 * aunque la base esté en uso) y borra las copias más viejas. Devuelve la ruta
 * del archivo creado.
 */
export async function runBackup(): Promise<string> {
  const dir = backupsDir();
  await mkdir(dir, { recursive: true });

  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  const file = path.join(dir, `ferretodo-${stamp}.db`);

  // VACUUM INTO exige que el destino no exista; el timestamp lo garantiza.
  await prisma.$executeRawUnsafe(`VACUUM INTO '${file.replace(/'/g, "''")}'`);

  await rotate(dir);
  return file;
}

async function rotate(dir: string) {
  const files = (await readdir(dir))
    .filter((f) => f.startsWith("ferretodo-") && f.endsWith(".db"))
    .sort();
  for (const f of files.slice(0, Math.max(0, files.length - KEEP))) {
    await unlink(path.join(dir, f));
  }
}
