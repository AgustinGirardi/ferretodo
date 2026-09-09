"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession } from "@/lib/auth";
import { clientIp } from "@/lib/client-ip";
import { lockedMinutes, recordFailure, clearFailures } from "@/lib/login-limit";
import { equalizeLoginTiming } from "@/lib/login-timing";

export interface LoginState {
  error?: string;
}

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { error: "Completá email y contraseña." };

  const ip = await clientIp();
  const locked = lockedMinutes(email, ip);
  if (locked > 0) {
    return { error: `Demasiados intentos fallidos. Probá de nuevo en ${locked} min.` };
  }

  const user = await prisma.adminUser.findUnique({ where: { email } });
  if (!user) {
    // Se compara igual contra un hash de descarte. Sin esto, un email que no es
    // el del admin contesta en ~5 ms y el correcto en ~100 ms: cualquiera podía
    // descubrir cuál es la cuenta del panel probando direcciones y midiendo.
    await equalizeLoginTiming(password);
    recordFailure(email, ip);
    return { error: "Email o contraseña incorrectos." };
  }
  if (!(await bcrypt.compare(password, user.passwordHash))) {
    recordFailure(email, ip);
    return { error: "Email o contraseña incorrectos." };
  }

  clearFailures(email, ip);
  await createSession(user.id, user.passwordHash);
  redirect("/admin");
}

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}
