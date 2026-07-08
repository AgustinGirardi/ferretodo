import { createRemoteJWKSet, jwtVerify } from "jose";

// Login con Google (OAuth 2.0 / OpenID Connect, sin librerías extra).
// Se activa solo si GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET están configurados;
// si faltan, el botón "Continuar con Google" no se muestra y todo sigue igual.

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

export function googleEnabled(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

/**
 * URL pública base del sitio. En producción (detrás del proxy de Render) la
 * request llega con host interno (localhost), así que los redirects NUNCA
 * deben construirse desde request.url: se usa NEXT_PUBLIC_SITE_URL.
 */
export function publicBaseUrl(request: Request): string {
  if (process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, "");
  }
  return new URL(request.url).origin;
}

export function googleRedirectUri(): string {
  const base =
    process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_SITE_URL
      ? process.env.NEXT_PUBLIC_SITE_URL
      : "http://localhost:3000";
  return `${base.replace(/\/+$/, "")}/api/auth/google/callback`;
}

export function googleAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: googleRedirectUri(),
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export interface GoogleProfile {
  sub: string;
  email: string;
  emailVerified: boolean;
  name: string;
}

/**
 * Canjea el `code` del callback por un id_token y lo verifica contra las
 * claves públicas de Google (firma, emisor y audiencia). Devuelve null ante
 * cualquier problema: el caller redirige con un error genérico.
 */
export async function exchangeGoogleCode(code: string): Promise<GoogleProfile | null> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: googleRedirectUri(),
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) return null;

  const data = (await res.json().catch(() => null)) as { id_token?: string } | null;
  if (!data?.id_token) return null;

  try {
    const { payload } = await jwtVerify(data.id_token, GOOGLE_JWKS, {
      issuer: ["https://accounts.google.com", "accounts.google.com"],
      audience: process.env.GOOGLE_CLIENT_ID!,
    });
    if (!payload.sub || typeof payload.email !== "string") return null;
    const email = payload.email.toLowerCase();
    return {
      sub: payload.sub,
      email,
      emailVerified: payload.email_verified === true,
      name:
        typeof payload.name === "string" && payload.name.trim()
          ? payload.name.trim()
          : email.split("@")[0] || email,
    };
  } catch {
    return null;
  }
}
