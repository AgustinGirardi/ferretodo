import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { googleAuthUrl, googleEnabled } from "@/lib/google-oauth";

export const dynamic = "force-dynamic";

// Inicia el login con Google: guarda un `state` anti-CSRF en cookie y redirige
// a la pantalla de consentimiento de Google.
export async function GET(request: Request) {
  if (!googleEnabled()) {
    return NextResponse.redirect(new URL("/cuenta", request.url));
  }

  const state = crypto.randomUUID();
  const store = await cookies();
  store.set("ft_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  return NextResponse.redirect(googleAuthUrl(state));
}
