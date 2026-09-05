import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { authSecretKey } from "./secret";
import { prisma } from "./prisma";
import { sessionVersion } from "./session-version";

export const SESSION_COOKIE = "ft_admin";

export async function createSession(userId: string, passwordHash: string) {
  // typ:"admin" evita que un token de cliente (mismo secreto) valga como admin.
  // pv ata el token a la contraseña vigente (ver lib/session-version.ts).
  const token = await new SignJWT({ sub: userId, typ: "admin", pv: sessionVersion(passwordHash) })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(authSecretKey());

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroySession() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function getAdminSession(): Promise<{ sub: string } | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, authSecretKey());
    if (payload.typ !== "admin") return null;
    const sub = String(payload.sub);
    // El usuario tiene que seguir existiendo y la contraseña ser la misma con la
    // que se abrió la sesión. Es una consulta más por request; el panel ya hace
    // varias y a cambio un cambio de contraseña expulsa de verdad.
    const user = await prisma.adminUser.findUnique({
      where: { id: sub },
      select: { passwordHash: true },
    });
    if (!user || payload.pv !== sessionVersion(user.passwordHash)) return null;
    return { sub };
  } catch {
    return null;
  }
}
