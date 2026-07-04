import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

/**
 * Crea el usuario admin inicial si la base está vacía (primer deploy en
 * producción). Solo actúa si ADMIN_EMAIL y ADMIN_PASSWORD están definidas.
 */
export async function ensureAdminUser() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return;

  const count = await prisma.adminUser.count();
  if (count > 0) return;

  await prisma.adminUser.create({
    data: {
      email,
      name: "Administrador",
      passwordHash: await bcrypt.hash(password, 10),
    },
  });
  console.log(`[bootstrap] usuario admin inicial creado: ${email}`);
}
