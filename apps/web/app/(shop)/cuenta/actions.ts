"use server";

import { headers } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { isValidEmail } from "@/lib/validation";
import { isRateLimited } from "@/lib/rate-limit";
import { lockedMinutes, recordFailure, clearFailures } from "@/lib/login-limit";
import { createSession } from "@/lib/auth";
import {
  createCustomerSession,
  destroyCustomerSession,
} from "@/lib/customer-auth";

export interface AuthState {
  error?: string;
  /** true cuando el login fue con credenciales de admin: el form redirige a /admin. */
  admin?: boolean;
}

export async function registerCustomer(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const ip = ((await headers()).get("x-forwarded-for") ?? "local").split(",")[0]?.trim() || "local";
  if (isRateLimited(`register:${ip}`, 5, 60 * 60_000)) {
    return { error: "Demasiados intentos. Probá de nuevo más tarde." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (name.length < 3) return { error: "Ingresá tu nombre y apellido." };
  if (!isValidEmail(email)) return { error: "El email no parece válido." };
  if (password.length < 8) return { error: "La contraseña debe tener al menos 8 caracteres." };

  const existing = await prisma.customer.findUnique({ where: { email } });
  if (existing) {
    return {
      error: existing.passwordHash
        ? "Ya existe una cuenta con ese email. Iniciá sesión."
        : "Ya existe una cuenta con ese email creada con Google. Usá «Continuar con Google».",
    };
  }

  const customer = await prisma.customer.create({
    data: { name, email, phone, passwordHash: await bcrypt.hash(password, 10) },
  });

  await createCustomerSession(customer.id);
  return {};
}

export async function loginCustomer(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { error: "Completá email y contraseña." };

  const key = `customer:${email}`;
  const locked = lockedMinutes(key);
  if (locked > 0) {
    return { error: `Demasiados intentos fallidos. Probá de nuevo en ${locked} min.` };
  }

  // Si las credenciales son las del administrador, se abre sesión de admin
  // (cookie ft_admin) y el formulario redirige al panel. Ante fallo, el error
  // es el mismo genérico de siempre para no revelar qué emails son de admin.
  const admin = await prisma.adminUser.findUnique({ where: { email } });
  if (admin && (await bcrypt.compare(password, admin.passwordHash))) {
    clearFailures(key);
    await createSession(admin.id);
    return { admin: true };
  }

  const customer = await prisma.customer.findUnique({ where: { email } });
  if (!customer || !customer.passwordHash) {
    recordFailure(key);
    // Sin passwordHash = cuenta creada con Google: no tiene contraseña propia.
    return {
      error: customer
        ? "Esa cuenta se creó con Google. Usá «Continuar con Google»."
        : "Email o contraseña incorrectos.",
    };
  }
  if (!(await bcrypt.compare(password, customer.passwordHash))) {
    recordFailure(key);
    return { error: "Email o contraseña incorrectos." };
  }

  clearFailures(key);
  await createCustomerSession(customer.id);
  return {};
}

export async function logoutCustomer() {
  await destroyCustomerSession();
}
