"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { clientIp } from "@/lib/client-ip";
import { isValidEmail } from "@/lib/validation";
import { isRateLimited } from "@/lib/rate-limit";
import { lockedMinutes, recordFailure, clearFailures } from "@/lib/login-limit";
import { equalizeLoginTiming } from "@/lib/login-timing";
import { createSession } from "@/lib/auth";
import {
  createCustomerSession,
  destroyCustomerSession,
  getCustomerSession,
} from "@/lib/customer-auth";
import { sendVerificationEmail } from "@/lib/email-verification";

export interface AuthState {
  error?: string;
  /** true cuando el login fue con credenciales de admin: el form redirige a /admin. */
  admin?: boolean;
  /** Aviso neutro del registro. Es el MISMO exista o no la cuenta (ver abajo). */
  notice?: string;
}

/** Respuesta única del registro: no revela si el email ya estaba registrado. */
const REGISTER_NOTICE =
  "Listo. Si el email no estaba registrado, te mandamos un link para confirmar la cuenta. " +
  "Revisá tu correo y después iniciá sesión.";

export async function registerCustomer(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const ip = await clientIp();
  if (isRateLimited(`register:${ip}`, 5, 60 * 60_000)) {
    return { error: "Demasiados intentos. Probá de nuevo más tarde." };
  }

  // Topes de longitud alineados con el resto del código (checkout y
  // arrepentimiento ya recortaban; acá no, y el campo entraba entero en la base
  // y después en cada backup diario).
  const name = String(formData.get("name") ?? "").trim().slice(0, 120);
  const email = String(formData.get("email") ?? "").trim().toLowerCase().slice(0, 200);
  const phone = String(formData.get("phone") ?? "").trim().slice(0, 40);
  const password = String(formData.get("password") ?? "");

  if (name.length < 3) return { error: "Ingresá tu nombre y apellido." };
  if (!isValidEmail(email)) return { error: "El email no parece válido." };
  if (password.length < 8) return { error: "La contraseña debe tener al menos 8 caracteres." };
  // bcrypt ignora todo lo que pase de 72 bytes, así que un tope alto no quita
  // nada de entropía y evita gastar CPU hasheando megabytes.
  if (password.length > 200) return { error: "La contraseña es demasiado larga." };

  // Respuesta idéntica exista o no la cuenta. Antes se devolvía "Ya existe una
  // cuenta con ese email", que convertía el formulario en un oráculo: probando
  // emails se sabía cuáles están registrados en la tienda.
  const existing = await prisma.customer.findUnique({ where: { email } });
  if (existing) return { notice: REGISTER_NOTICE };

  let customer;
  try {
    customer = await prisma.customer.create({
      data: { name, email, phone, passwordHash: await bcrypt.hash(password, 10) },
    });
  } catch (e) {
    // Carrera: dos registros simultáneos con el mismo email (unique constraint).
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { notice: REGISTER_NOTICE };
    }
    throw e;
  }

  // El link de confirmación no bloquea el registro: si el envío falla, la cuenta
  // ya existe y el link se puede volver a pedir desde "Mi cuenta".
  try {
    await sendVerificationEmail(customer.id, customer.email, customer.name);
  } catch (e) {
    console.error("[cuenta] no se pudo enviar el email de verificación:", e);
  }

  // El registro NO abre sesión. Son dos razones distintas y las dos importan:
  // 1) Si iniciara sesión, la respuesta delataría igual si el email existía
  //    (quedás adentro) o no (seguís afuera), y el punto anterior no serviría.
  // 2) Cualquiera podía registrar el email de otra persona y quedarse con una
  //    sesión de 30 días sobre una cuenta que después la víctima "adopta" al
  //    confirmar el email. Sin sesión, esa fila no le sirve de nada al atacante.
  return { notice: REGISTER_NOTICE };
}

export async function loginCustomer(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  // Tope por IP (frena credential stuffing horizontal: una contraseña contra
  // muchos emails). El lockout por cuenta de abajo frena el brute force vertical.
  const ip = await clientIp();
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
  const locked = Math.max(lockedMinutes(email, ip), lockedMinutes(customerKey, ip));
  if (locked > 0) {
    return { error: `Demasiados intentos fallidos. Probá de nuevo en ${locked} min.` };
  }

  // Un email de admin se trata como admin (nunca cae al path de cliente). Si las
  // credenciales matchean, se abre sesión de admin y el form redirige al panel.
  const admin = await prisma.adminUser.findUnique({ where: { email } });
  if (admin) {
    if (await bcrypt.compare(password, admin.passwordHash)) {
      clearFailures(email, ip);
      await createSession(admin.id, admin.passwordHash);
      return { admin: true };
    }
    recordFailure(email, ip);
    return { error: "Email o contraseña incorrectos." };
  }

  // Cliente. Error genérico siempre (no se revela si el email existe ni si es
  // una cuenta creada con Google sin contraseña).
  const customer = await prisma.customer.findUnique({ where: { email } });
  if (!customer || !customer.passwordHash) {
    // Sin fila o sin contraseña propia no hay nada que comparar, pero se compara
    // igual contra un hash de descarte: si no, este camino contesta en ~5 ms y el
    // de una cuenta real en ~100 ms, y esa diferencia enumera cuentas.
    await equalizeLoginTiming(password);
    recordFailure(customerKey, ip);
    return { error: "Email o contraseña incorrectos." };
  }
  if (!(await bcrypt.compare(password, customer.passwordHash))) {
    recordFailure(customerKey, ip);
    return { error: "Email o contraseña incorrectos." };
  }

  clearFailures(customerKey, ip);
  await createCustomerSession(customer.id, customer.passwordHash, customer.sessionEpoch);
  return {};
}

/**
 * Cierra la sesión en todos los dispositivos incrementando el epoch de la cuenta.
 * Es la palanca que le faltaba al cliente: hasta ahora, una cookie robada valía
 * 30 días y no había ninguna forma de invalidarla (no existe cambio de
 * contraseña del lado cliente, y las cuentas de Google ni siquiera tienen una).
 */
export async function logoutEverywhere() {
  const session = await getCustomerSession();
  if (!session) redirect("/cuenta");

  await prisma.customer.update({
    where: { id: session.sub },
    data: { sessionEpoch: { increment: 1 } },
  });
  await destroyCustomerSession();
  redirect("/cuenta");
}

export async function logoutCustomer() {
  await destroyCustomerSession();
}

/** Vuelve a mandar el link de confirmación al email de la cuenta abierta. */
export async function resendVerification() {
  const session = await getCustomerSession();
  if (!session) redirect("/cuenta");

  const ip = await clientIp();
  // Tope por cuenta y por conexión: el link va a un email que no controlamos,
  // así que sin freno el formulario sirve para bombardear una casilla ajena.
  if (
    isRateLimited(`verify:${session.sub}`, 3, 60 * 60_000) ||
    isRateLimited(`verify:${ip}`, 10, 60 * 60_000)
  ) {
    redirect("/cuenta?error=reenvio");
  }

  const customer = await prisma.customer.findUnique({ where: { id: session.sub } });
  if (customer && !customer.emailVerifiedAt) {
    try {
      await sendVerificationEmail(customer.id, customer.email, customer.name);
    } catch (e) {
      console.error("[cuenta] no se pudo reenviar el email de verificación:", e);
    }
  }
  redirect("/cuenta?reenviado=1");
}
