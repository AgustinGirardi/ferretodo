import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PasswordForm } from "@/components/admin/password-form";

export const dynamic = "force-dynamic";

export default async function AdminAccountPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  const admin = await prisma.adminUser.findUnique({ where: { id: session.sub } });

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-fg">Mi cuenta</h1>
      <p className="mb-6 text-sm text-muted">
        Sesión iniciada como <span className="font-medium text-fg">{admin?.email}</span>
      </p>

      <div className="max-w-md rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-4 font-medium text-fg">Cambiar contraseña</h2>
        <PasswordForm />
      </div>
    </div>
  );
}
