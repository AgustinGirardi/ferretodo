import type { Metadata } from "next";
import Link from "next/link";
import { LogOut, Package, Inbox, LayoutDashboard } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { getCustomerSession } from "@/lib/customer-auth";
import { formatPrice } from "@/lib/format";
import { orderStatus } from "@/lib/order-status";
import { googleEnabled } from "@/lib/google-oauth";
import { CustomerAuthForms } from "@/components/account/customer-auth-forms";
import { logoutCustomer } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mi cuenta",
  description: "Iniciá sesión o creá una cuenta para comprar en FERRETODO.",
};

/**
 * Acceso al panel: solo se muestra en esta página (no en el header) y solo si
 * hay sesión de admin válida cuyo AdminUser sigue existiendo.
 */
async function AdminPanelBanner() {
  const adminSession = await getAdminSession();
  if (!adminSession) return null;
  const admin = await prisma.adminUser.findUnique({
    where: { id: adminSession.sub },
    select: { id: true },
  });
  if (!admin) return null;

  return (
    <div className="mx-auto mb-6 max-w-md">
      <Link
        href="/admin"
        className="flex items-center justify-center gap-2 rounded-md border border-brand-500 bg-brand-50 px-5 py-2.5 text-sm font-semibold text-brand-600 transition-colors hover:bg-brand-500 hover:text-white dark:bg-transparent dark:text-brand-500 dark:hover:bg-brand-500 dark:hover:text-white"
      >
        <LayoutDashboard className="h-4 w-4" />
        Ir al panel de administración
      </Link>
    </div>
  );
}

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getCustomerSession();
  const { error } = await searchParams;
  const oauthError =
    error === "google"
      ? "No pudimos completar el ingreso con Google. Probá de nuevo."
      : error === "cuenta_existente"
        ? "Ya existe una cuenta con ese email creada con contraseña. Iniciá sesión con tu contraseña y después vinculás Google."
        : undefined;

  if (!session) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-10">
        <h1 className="mb-1 text-center text-2xl font-bold text-fg">Mi cuenta</h1>
        <p className="mb-8 text-center text-sm text-muted">
          Iniciá sesión o creá una cuenta para comprar más rápido y ver tus pedidos.
        </p>
        <AdminPanelBanner />
        <CustomerAuthForms googleEnabled={googleEnabled()} oauthError={oauthError} />
      </div>
    );
  }

  const customer = await prisma.customer.findUnique({ where: { id: session.sub } });
  if (!customer) {
    // Sesión de una cuenta que ya no existe: se trata como no logueado.
    return (
      <div className="container mx-auto max-w-2xl px-4 py-10">
        <h1 className="mb-8 text-center text-2xl font-bold text-fg">Mi cuenta</h1>
        <CustomerAuthForms googleEnabled={googleEnabled()} oauthError={oauthError} />
      </div>
    );
  }

  // Por customerId (pedidos hechos con esta sesión), nunca por email: el email
  // no está verificado, así que matchear por email filtraría pedidos ajenos.
  const orders = await prisma.order.findMany({
    where: { customerId: customer.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { items: true } } },
  });

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-fg">Hola, {customer.name.split(" ")[0]}</h1>
          <p className="text-sm text-muted">{customer.email}</p>
        </div>
        <form action={logoutCustomer}>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm text-fg transition-colors hover:bg-surface"
          >
            <LogOut className="h-4 w-4" /> Cerrar sesión
          </button>
        </form>
      </div>

      <h2 className="mb-3 flex items-center gap-2 font-medium text-fg">
        <Package className="h-4 w-4" /> Mis pedidos
      </h2>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
          <Inbox className="h-10 w-10 text-muted" />
          <p className="text-sm font-medium text-fg">Todavía no hiciste ningún pedido</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          {orders.map((o) => {
            const st = orderStatus(o.status);
            return (
              <div
                key={o.id}
                className="flex items-center justify-between border-b border-border px-4 py-3 last:border-0"
              >
                <div>
                  <p className="font-medium text-fg">{o.orderNumber}</p>
                  <p className="text-xs text-muted">
                    {new Date(o.createdAt).toLocaleDateString("es-AR")} ·{" "}
                    {o._count.items} {o._count.items === 1 ? "producto" : "productos"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${st.className}`}>
                    {st.label}
                  </span>
                  <span className="font-medium text-fg">{formatPrice(o.total)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
