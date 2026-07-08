import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { createCustomerSession } from "@/lib/customer-auth";
import { exchangeGoogleCode, googleEnabled, publicBaseUrl } from "@/lib/google-oauth";

export const dynamic = "force-dynamic";

function toAccount(request: Request, error?: string) {
  const url = new URL("/cuenta", publicBaseUrl(request));
  if (error) url.searchParams.set("error", error);
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  if (!googleEnabled()) return toAccount(request);

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  const store = await cookies();
  const expected = store.get("ft_oauth_state")?.value;
  store.delete("ft_oauth_state");

  if (!code || !state || !expected || state !== expected) return toAccount(request, "google");

  try {
    const profile = await exchangeGoogleCode(code);
    // Solo se acepta un email verificado por Google: es lo que permite vincular
    // de forma segura con una cuenta existente del mismo email.
    if (!profile || !profile.emailVerified) return toAccount(request, "google");

    let customer = await prisma.customer.findUnique({ where: { googleId: profile.sub } });
    if (!customer) {
      const byEmail = await prisma.customer.findUnique({ where: { email: profile.email } });
      if (byEmail) {
        // Ya existe una cuenta con ese email. Si tiene contraseña propia NO se
        // vincula en silencio: el registro con contraseña no verifica el email,
        // así que esa fila pudo crearla un tercero. Vincular Google le daría a
        // ese tercero acceso permanente a la cuenta. Se exige iniciar sesión con
        // la contraseña primero (prueba de titularidad de la cuenta local).
        if (byEmail.passwordHash) return toAccount(request, "cuenta_existente");
        // Cuenta sin contraseña (creada con Google pero sin googleId aún): vincular.
        customer = await prisma.customer.update({
          where: { id: byEmail.id },
          data: { googleId: profile.sub },
        });
      } else {
        customer = await prisma.customer.create({
          data: { name: profile.name, email: profile.email, googleId: profile.sub },
        });
      }
    }

    await createCustomerSession(customer.id);
    return toAccount(request);
  } catch (e) {
    // Falla de red con Google, carrera de creación (P2002), etc: redirect con
    // error en vez de una pantalla 500 cruda.
    console.error("[google-oauth] callback falló:", e);
    return toAccount(request, "google");
  }
}
