"use server";

import { headers } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { isValidEmail } from "@/lib/validation";
import { isRateLimited } from "@/lib/rate-limit";
import { lockedMinutes, recordFailure, clearFailures } from "@/lib/login-limit";
import {
  createCustomerSession,
  destroyCustomerSession,
} from "@/lib/customer-auth";

export interface AuthState {
  error?: string;
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
  if (existing) return { error: "Ya existe una cuenta con ese email. Iniciá sesión." };

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

  const customer = await prisma.customer.findUnique({ where: { email } });
  if (!customer || !(await bcrypt.compare(password, customer.passwordHash))) {
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
