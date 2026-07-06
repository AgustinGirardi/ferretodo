// Clave compartida para firmar sesiones (admin y cliente). Sin dependencias de
// Node ni de next/headers para poder importarse también desde middleware (edge).

export function authSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("AUTH_SECRET debe estar definida (mínimo 32 caracteres) en producción.");
    }
    return new TextEncoder().encode("dev-secret-cambiar-en-produccion-min-32-chars");
  }
  return new TextEncoder().encode(secret);
}
