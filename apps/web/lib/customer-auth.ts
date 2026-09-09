import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { authSecretKey } from "./secret";
import { prisma } from "./prisma";
import { sessionVersion } from "./session-version";

export const CUSTOMER_SESSION_COOKIE = "ft_customer";

export async function createCustomerSession(
  customerId: string,
  passwordHash: string | null,
  sessionEpoch: number = 0,
) {
  // pv ata el token a la contraseña vigente Y al epoch de sesiones de la cuenta
  // (ver lib/session-version.ts). El epoch es lo que permite revocar las cuentas
  // de Google, que no tienen contraseña propia y por eso compartían todas la
  // misma huella.
  const token = await new SignJWT({
    sub: customerId,
    typ: "customer",
    pv: sessionVersion(passwordHash, sessionEpoch),
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(authSecretKey());

  const store = await cookies();
  store.set(CUSTOMER_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function destroyCustomerSession() {
  (await cookies()).delete(CUSTOMER_SESSION_COOKIE);
}

export async function getCustomerSession(): Promise<{ sub: string } | null> {
  const token = (await cookies()).get(CUSTOMER_SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, authSecretKey());
    if (payload.typ !== "customer") return null;
    const sub = String(payload.sub);
    const customer = await prisma.customer.findUnique({
      where: { id: sub },
      select: { passwordHash: true, sessionEpoch: true },
    });
    if (!customer || payload.pv !== sessionVersion(customer.passwordHash, customer.sessionEpoch)) {
      return null;
    }
    return { sub };
  } catch {
    return null;
  }
}
