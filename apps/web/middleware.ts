import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { authSecretKey } from "./lib/secret";

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("ft_admin")?.value;
  let valid = false;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, authSecretKey());
      // Solo tokens de admin: un token de cliente (mismo secreto) no vale acá.
      valid = payload.typ === "admin";
    } catch {
      valid = false;
    }
  }

  if (!valid) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

// Protege todo /admin excepto la página de login.
export const config = {
  matcher: ["/admin/((?!login).*)", "/admin"],
};
