import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { createCustomerSession } from "@/lib/customer-auth";
import { exchangeGoogleCode, googleEnabled } from "@/lib/google-oauth";

export const dynamic = "force-dynamic";

function toAccount(request: Request, error?: string) {
  const url = new URL("/cuenta", request.url);
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

  const profile = await exchangeGoogleCode(code);
  // Solo se acepta un email verificado por Google: es lo que permite vincular
  // de forma segura con una cuenta existente del mismo email.
  if (!profile || !profile.emailVerified) return toAccount(request, "google");

  let customer = await prisma.customer.findUnique({ where: { googleId: profile.sub } });
  if (!customer) {
    const byEmail = await prisma.customer.findUnique({ where: { email: profile.email } });
    customer = byEmail
      ? await prisma.customer.update({ where: { id: byEmail.id }, data: { googleId: profile.sub } })
      : await prisma.customer.create({
          data: { name: profile.name, email: profile.email, googleId: profile.sub },
        });
  }

  await createCustomerSession(customer.id);
  return toAccount(request);
}
