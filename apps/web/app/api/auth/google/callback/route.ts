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
        // Ya existe una cuenta con ese email. Si tiene contraseña propia y el
        // email NUNCA fue confirmado, no se vincula en silencio: esa fila la pudo
        // crear un tercero con el email de otra persona, y vincular Google le
        // daría acceso permanente. Se exige iniciar sesión con la contraseña
        // primero (prueba de titularidad de la cuenta local).
        // Si el email sí está confirmado, el dueño de la casilla es quien creó la
        // cuenta y Google acaba de verificar esa misma casilla: es la misma
        // persona, y vincular es seguro.
        if (byEmail.passwordHash && !byEmail.emailVerifiedAt) {
          return toAccount(request, "cuenta_existente");
        }
        // Google ya verificó el email, así que la cuenta queda verificada también.
        //
        // Se da de baja la contraseña local y se incrementa el epoch de sesiones.
        // El motivo no es de higiene sino de un ataque concreto: un tercero podía
        // registrar el email de la víctima con una contraseña suya, y el mail de
        // confirmación —que daba por hecho que la cuenta la había creado quien lo
        // recibía— conseguía que la víctima tocara el botón. Con `emailVerifiedAt`
        // ya seteado, la guarda de arriba dejaba de disparar y este update pegaba
        // el googleId de la víctima sobre la fila del atacante, que conservaba su
        // contraseña y su sesión. Borrar el hash le saca la credencial, y el epoch
        // le corta las cookies que ya tenía abiertas.
        //
        // Consecuencia buscada: al vincular Google, la cuenta pasa a entrar solo
        // con Google. Es la única opción segura, porque desde acá no hay forma de
        // distinguir a un dueño que eligió vincular de una víctima de lo anterior.
        customer = await prisma.customer.update({
          where: { id: byEmail.id },
          data: {
            googleId: profile.sub,
            emailVerifiedAt: byEmail.emailVerifiedAt ?? new Date(),
            passwordHash: null,
            sessionEpoch: { increment: 1 },
          },
        });
      } else {
        customer = await prisma.customer.create({
          data: {
            name: profile.name,
            email: profile.email,
            googleId: profile.sub,
            emailVerifiedAt: new Date(),
          },
        });
      }
    }

    await createCustomerSession(customer.id, customer.passwordHash, customer.sessionEpoch);
    return toAccount(request);
  } catch (e) {
    // Falla de red con Google, carrera de creación (P2002), etc: redirect con
    // error en vez de una pantalla 500 cruda.
    console.error("[google-oauth] callback falló:", e);
    return toAccount(request, "google");
  }
}
