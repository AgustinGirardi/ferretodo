import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminNav } from "@/components/admin/admin-nav";
import { logout } from "../actions";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const admin = await prisma.adminUser.findUnique({ where: { id: session.sub } });

  return (
    <div className="dark min-h-screen bg-bg text-fg">
      <div className="flex">
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-surface md:flex">
          <div className="border-b border-border p-4">
            <span className="text-lg font-bold tracking-tight text-fg">
              FERRE<span className="text-brand-500">TODO</span>
            </span>
            <p className="text-xs text-muted">Administración</p>
          </div>
          <AdminNav />
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="flex h-14 items-center justify-between border-b border-border px-4 sm:px-6">
            <span className="text-sm text-muted">
              Hola, <span className="font-medium text-fg">{admin?.name ?? "Admin"}</span>
            </span>
            <form action={logout}>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm text-fg transition-colors hover:bg-surface"
              >
                <LogOut className="h-4 w-4" /> Salir
              </button>
            </form>
          </header>

          <main className="flex-1 p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
