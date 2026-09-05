"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession, getAdminSession } from "@/lib/auth";

export interface PasswordState {
  ok?: boolean;
  error?: string;
}

export async function changePassword(
  _prev: PasswordState,
  formData: FormData,
): Promise<PasswordState> {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!current || !next || !confirm) return { error: "Completá todos los campos." };
  if (next.length < 8) return { error: "La nueva contraseña debe tener al menos 8 caracteres." };
  if (next !== confirm) return { error: "Las contraseñas nuevas no coinciden." };

  const user = await prisma.adminUser.findUnique({ where: { id: session.sub } });
  if (!user || !(await bcrypt.compare(current, user.passwordHash))) {
    return { error: "La contraseña actual es incorrecta." };
  }

  const passwordHash = await bcrypt.hash(next, 10);
  await prisma.adminUser.update({ where: { id: user.id }, data: { passwordHash } });

  // La sesión vieja ya no vale (su `pv` quedó atado a la contraseña anterior),
  // así que se emite una nueva para esta pestaña. En cualquier otro dispositivo
  // donde la sesión estuviera abierta, el próximo click pide login de nuevo.
  await createSession(user.id, passwordHash);

  return { ok: true };
}
