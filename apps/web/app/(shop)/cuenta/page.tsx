import type { Metadata } from "next";
import { LogOut, Package, Inbox, MailCheck, MailWarning } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCustomerSession } from "@/lib/customer-auth";
import { formatPrice } from "@/lib/format";
import { orderStatus } from "@/lib/order-status";
import { googleEnabled } from "@/lib/google-oauth";
import { CustomerAuthForms } from "@/components/account/customer-auth-forms";
import { logoutCustomer, resendVerification } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mi cuenta",
  description: "Iniciá sesión o creá una cuenta para comprar en FERRETODO.",
};

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; verificado?: string; reenviado?: string }>;
}) {
  const session = await getCustomerSession();
  const { error, verificado, reenviado } = await searchParams;
  const oauthError =
    error === "google"
      ? "No pudimos completar el ingreso con Google. Probá de nuevo."
      : error === "cuenta_existente"
        ? "Ya existe una cuenta con ese email creada con contraseña. Iniciá sesión con tu contraseña y después vinculás Google."
        : error === "verificacion"
          ? "El link de confirmación no sirve o ya venció. Pedí uno nuevo desde tu cuenta."
          : error === "reenvio"
            ? "Ya pediste el link varias veces. Esperá un rato antes de volver a intentarlo."
            : undefined;

  if (!session) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-10">
        <h1 className="mb-1 text-center text-2xl font-bold text-fg">Mi cuenta</h1>
        <p className="mb-8 text-center text-sm text-muted">
          Iniciá sesión o creá una cuenta para comprar más rápido y ver tus pedidos.
        </p>
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

  // Por customerId (pedidos hechos con esta sesión), nunca por email: el email de
  // un pedido lo escribe el comprador en el checkout y puede ser cualquiera, así
  // que matchear por email mostraría pedidos ajenos.
  const orders = await prisma.order.findMany({
    where: { customerId: customer.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { items: true } } },
  });

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      {verificado === "1" && (
        <p className="mb-6 flex items-center gap-2 rounded-lg border border-success bg-surface px-4 py-3 text-sm text-fg">
          <MailCheck className="h-4 w-4 shrink-0 text-success" />
          Listo, confirmamos tu email.
        </p>
      )}

      {oauthError && (
        <p className="mb-6 rounded-lg border border-border bg-surface px-4 py-3 text-sm text-fg">
          {oauthError}
        </p>
      )}

      {/* Sin confirmar, la cuenta no prueba que el email sea de quien la creó.
          Confirmarlo es también lo que después habilita a entrar con Google. */}
      {!customer.emailVerifiedAt && (
        <div className="mb-6 flex flex-col gap-2 rounded-lg border border-warning bg-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-2 text-sm text-fg">
            <MailWarning className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            <span>
              {reenviado === "1"
                ? `Te mandamos un link a ${customer.email}. Revisá tu correo (y el spam).`
                : "Todavía no confirmaste tu email. Te mandamos un link cuando creaste la cuenta."}
            </span>
          </p>
          {reenviado !== "1" && (
            <form action={resendVerification} className="shrink-0">
              <button
                type="submit"
                className="rounded-md border border-border px-3 py-1.5 text-sm text-fg transition-colors hover:bg-bg"
              >
                Reenviar link
              </button>
            </form>
          )}
        </div>
      )}

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
