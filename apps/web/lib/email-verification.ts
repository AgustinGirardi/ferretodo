import { SignJWT, jwtVerify } from "jose";
import { authSecretKey } from "./secret";
import { sendSimpleEmail } from "./email";
import { siteUrl } from "./site";

/**
 * Verificación del email de una cuenta de cliente.
 *
 * El registro con contraseña no probaba nada: cualquiera podía crear una cuenta
 * con el email de otra persona. El link que se manda acá es esa prueba, y es lo
 * que después habilita a vincular la cuenta con Google sin riesgo (ver
 * app/api/auth/google/callback).
 *
 * El token es un JWT firmado con el mismo secreto que las sesiones, así que no
 * hace falta una tabla de tokens. Lleva el email adentro: si la cuenta cambia de
 * email, los links viejos dejan de servir.
 */
const TOKEN_TYPE = "verify-email";
const TOKEN_TTL = "24h";

export async function verificationLink(customerId: string, email: string): Promise<string> {
  const token = await new SignJWT({ sub: customerId, typ: TOKEN_TYPE, email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL)
    .sign(authSecretKey());
  return `${siteUrl}/api/auth/verificar-email?token=${encodeURIComponent(token)}`;
}

export async function readVerificationToken(
  token: string,
): Promise<{ sub: string; email: string } | null> {
  try {
    const { payload } = await jwtVerify(token, authSecretKey());
    if (payload.typ !== TOKEN_TYPE || typeof payload.email !== "string") return null;
    return { sub: String(payload.sub), email: payload.email };
  } catch {
    return null;
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}

/** Manda el email con el link. Nunca lanza: si el envío falla, la cuenta ya está
 *  creada y el cliente puede pedir el link de nuevo desde "Mi cuenta". */
export async function sendVerificationEmail(
  customerId: string,
  email: string,
  name: string,
): Promise<void> {
  const link = await verificationLink(customerId, email);
  const html = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:520px;margin:0 auto;color:#0f172a">
      <h1 style="font-size:20px;margin:0 0 12px">Confirmá tu email</h1>
      <p style="margin:0 0 16px;line-height:1.5">
        Hola ${escapeHtml(name.split(" ")[0] || name)}, creaste una cuenta en FERRETODO con este email.
        Tocá el botón para confirmar que es tuyo.
      </p>
      <p style="margin:0 0 20px">
        <a href="${link}" style="display:inline-block;background:#c74806;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600">
          Confirmar mi email
        </a>
      </p>
      <p style="margin:0 0 8px;font-size:13px;color:#64748b;line-height:1.5">
        El link vence en 24 horas. Si no creaste ninguna cuenta, ignorá este mensaje:
        sin confirmar, la cuenta no queda asociada a vos.
      </p>
    </div>
  `;
  await sendSimpleEmail(email, "Confirmá tu email en FERRETODO", html);
}
