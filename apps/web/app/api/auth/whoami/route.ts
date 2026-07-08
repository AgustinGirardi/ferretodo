import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Le dice al header si quien navega es el admin (para mostrar el botón "Panel").
// Verifica que el AdminUser siga existiendo, no solo que la cookie sea válida.
export async function GET() {
  const session = await getAdminSession();
  let admin = false;
  if (session) {
    admin = Boolean(
      await prisma.adminUser.findUnique({ where: { id: session.sub }, select: { id: true } }),
    );
  }
  return NextResponse.json({ admin }, { headers: { "Cache-Control": "no-store" } });
}
