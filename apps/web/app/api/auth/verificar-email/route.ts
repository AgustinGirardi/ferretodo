import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readVerificationToken } from "@/lib/email-verification";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

function toAccount(status: "ok" | "error") {
  const url = new URL("/cuenta", siteUrl);
  url.searchParams.set(status === "ok" ? "verificado" : "error", status === "ok" ? "1" : "verificacion");
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  if (!token) return toAccount("error");

  const payload = await readVerificationToken(token);
  if (!payload) return toAccount("error");

  const customer = await prisma.customer.findUnique({
    where: { id: payload.sub },
    select: { id: true, email: true, emailVerifiedAt: true },
  });
  // El email del token tiene que seguir siendo el de la cuenta: si la cambió,
  // el link viejo ya no prueba nada sobre la dirección actual.
  if (!customer || customer.email !== payload.email) return toAccount("error");

  if (!customer.emailVerifiedAt) {
    await prisma.customer.update({
      where: { id: customer.id },
      data: { emailVerifiedAt: new Date() },
    });
  }
  return toAccount("ok");
}
