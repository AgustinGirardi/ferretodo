import { redirect } from "next/navigation";
import { DatabaseBackup } from "lucide-react";
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

      <div className="mt-6 max-w-md rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-2 font-medium text-fg">Copia de seguridad</h2>
        <p className="mb-4 text-sm text-muted">
          La tienda hace una copia automática de la base todos los días. Igual te recomendamos
          descargar una copia cada tanto y guardarla en tu computadora.
        </p>
        {/* POST, no un link: generar la copia también borra las más viejas. */}
        <form method="post" action="/admin/backup">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium text-fg transition-colors hover:border-brand-500 hover:text-brand-600"
          >
            <DatabaseBackup className="h-4 w-4" /> Descargar copia ahora
          </button>
        </form>
      </div>
    </div>
  );
}
