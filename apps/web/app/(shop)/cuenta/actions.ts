"use server";

import { headers } from "next/headers";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
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

  // No se revela el tipo de cuenta (contraseña vs Google) para no filtrar info.
  const existing = await prisma.customer.findUnique({ where: { email } });
  if (existing) return { error: "Ya existe una cuenta con ese email. Iniciá sesión." };

  let customer;
  try {
    customer = await prisma.customer.create({
      data: { name, email, phone, passwordHash: await bcrypt.hash(password, 10) },
    });
  } catch (e) {
    // Carrera: dos registros simultáneos con el mismo email (unique constraint).
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { error: "Ya existe una cuenta con ese email. Iniciá sesión." };
    }
    throw e;
  }

  await createCustomerSession(customer.id);
  return {};
}

export async function loginCustomer(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  // Tope por IP (frena credential stuffing horizontal: una contraseña contra
  // muchos emails). El lockout por cuenta de abajo frena el brute force vertical.
  const ip = ((await headers()).get("x-forwarded-for") ?? "local").split(",")[0]?.trim() || "local";
  if (isRateLimited(`login:${ip}`, 20, 15 * 60_000)) {
    return { error: "Demasiados intentos. Probá de nuevo más tarde." };
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { error: "Completá email y contraseña." };

  // Lockout por cuenta. La clave de admin es el email crudo (la MISMA que usa
  // /admin/login) para no duplicar el umbral de bloqueo de la cuenta admin; la
  // de cliente va bajo `customer:${email}`.
  const customerKey = `customer:${email}`;
  const locked = Math.max(lockedMinutes(email), lockedMinutes(customerKey));
  if (locked > 0) {
    return { error: `Demasiados intentos fallidos. Probá de nuevo en ${locked} min.` };
  }

  // Un email de admin se trata como admin (nunca cae al path de cliente). Si las
  // credenciales matchean, se abre sesión de admin y el form redirige al panel.
  const admin = await prisma.adminUser.findUnique({ where: { email } });
  if (admin) {
    if (await bcrypt.compare(password, admin.passwordHash)) {
      clearFailures(email);
      await createSession(admin.id);
      return { admin: true };
    }
    recordFailure(email);
    return { error: "Email o contraseña incorrectos." };
  }

  // Cliente. Error genérico siempre (no se revela si el email existe ni si es
  // una cuenta creada con Google sin contraseña).
  const customer = await prisma.customer.findUnique({ where: { email } });
  if (!customer || !customer.passwordHash || !(await bcrypt.compare(password, customer.passwordHash))) {
    recordFailure(customerKey);
    return { error: "Email o contraseña incorrectos." };
  }

  clearFailures(customerKey);
  await createCustomerSession(customer.id);
  return {};
}

export async function logoutCustomer() {
  await destroyCustomerSession();
}
