import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

function secretKey() {
  return new TextEncoder().encode(
    process.env.AUTH_SECRET || "dev-secret-cambiar-en-produccion-min-32-chars",
  );
}

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("ft_admin")?.value;
  let valid = false;
  if (token) {
    try {
      await jwtVerify(token, secretKey());
      valid = true;
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
