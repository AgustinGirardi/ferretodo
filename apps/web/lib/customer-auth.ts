import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { authSecretKey } from "./secret";

export const CUSTOMER_SESSION_COOKIE = "ft_customer";

export async function createCustomerSession(customerId: string) {
  const token = await new SignJWT({ sub: customerId, typ: "customer" })
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
    return { sub: String(payload.sub) };
  } catch {
    return null;
  }
}
