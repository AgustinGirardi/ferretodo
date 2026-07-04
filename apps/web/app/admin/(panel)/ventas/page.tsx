import Link from "next/link";
import { Download, Receipt, ShoppingBag, TrendingUp, XCircle, Inbox } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { orderStatus, PAYMENT_LABELS, DELIVERY_LABELS } from "@/lib/order-status";
import { SALES_PERIODS, asPeriod, getOrdersForPeriod } from "@/lib/sales";

export const dynamic = "force-dynamic";

export default async function AdminSalesPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>;
}) {
  const periodo = asPeriod((await searchParams).periodo);
  const orders = await getOrdersForPeriod(periodo);

  // Las ventas excluyen pedidos cancelados; los movimientos muestran todo.
  const sales = orders.filter((o) => o.status !== "CANCELLED");
  const cancelledCount = orders.length - sales.length;
  const revenue = sales.reduce((s, o) => s + o.total, 0);
  const avgTicket = sales.length ? Math.round(revenue / sales.length) : 0;

  const byPayment = new Map<string, { count: number; total: number }>();
  for (const o of sales) {
    const e = byPayment.get(o.paymentMethod) ?? { count: 0, total: 0 };
    e.count += 1;
    e.total += o.total;
    byPayment.set(o.paymentMethod, e);
  }

  const byProduct = new Map<string, { qty: number; total: number }>();
  for (const o of sales) {
    for (const it of o.items) {
      const e = byProduct.get(it.productName) ?? { qty: 0, total: 0 };
      e.qty += it.quantity;
      e.total += it.lineTotal;
      byProduct.set(it.productName, e);
    }
  }
  const topProducts = [...byProduct.entries()]
    .sort((a, b) => b[1].qty - a[1].qty)
    .slice(0, 5);

  const cards = [
    { label: "Facturado", value: formatPrice(revenue), icon: TrendingUp },
    { label: "Ventas", value: String(sales.length), icon: ShoppingBag },
    { label: "Ticket promedio", value: formatPrice(avgTicket), icon: Receipt },
    { label: "Cancelados", value: String(cancelledCount), icon: XCircle },
  ];

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-fg">Ventas y movimientos</h1>
      <p className="mb-6 text-sm text-muted">
        Todo lo que se vendió y se movió en tu tienda, para que tengas el control.
      </p>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {SALES_PERIODS.map((p) => (
            <Link
              key={p.key}
              href={`/admin/ventas?periodo=${p.key}`}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                p.key === periodo
                  ? "bg-brand-500 text-white"
                  : "border border-border text-muted hover:bg-surface hover:text-fg"
              }`}
            >
              {p.label}
            </Link>
          ))}
        </div>
        <a
          href={`/admin/ventas/export?periodo=${periodo}`}
          className="inline-flex items-center gap-2 rounded-md border border-border px-3.5 py-1.5 text-sm font-medium text-fg transition-colors hover:border-brand-500 hover:text-brand-500"
        >
          <Download className="h-4 w-4" /> Descargar Excel (CSV)
        </a>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">{c.label}</span>
                <Icon className="h-4 w-4 text-muted" />
              </div>
              <div className="mt-2 text-2xl font-bold text-fg">{c.value}</div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-4">
          <h2 className="mb-3 text-sm font-medium text-fg">Por forma de pago</h2>
          {byPayment.size === 0 ? (
            <p className="text-sm text-muted">Sin ventas en este período.</p>
          ) : (
            <ul className="space-y-2">
              {[...byPayment.entries()].map(([method, e]) => (
                <li key={method} className="flex items-center justify-between text-sm">
                  <span className="text-muted">
                    {PAYMENT_LABELS[method] ?? method}
                    <span className="ml-2 text-xs">
                      ({e.count} {e.count === 1 ? "venta" : "ventas"})
                    </span>
                  </span>
                  <span className="font-medium text-fg">{formatPrice(e.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-border bg-surface p-4">
          <h2 className="mb-3 text-sm font-medium text-fg">Productos más vendidos</h2>
          {topProducts.length === 0 ? (
            <p className="text-sm text-muted">Sin ventas en este período.</p>
          ) : (
            <ul className="space-y-2">
              {topProducts.map(([name, e]) => (
                <li key={name} className="flex items-center justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate text-muted">
                    {name}
                    <span className="ml-2 text-xs">× {e.qty}</span>
                  </span>
                  <span className="shrink-0 font-medium text-fg">{formatPrice(e.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="mb-3 font-medium text-fg">Movimientos</h2>
        {orders.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
            <Inbox className="h-10 w-10 text-muted" />
            <p className="text-sm font-medium text-fg">Sin movimientos en este período</p>
            <p className="max-w-xs text-sm text-muted">
              Cuando entren ventas, las vas a ver acá con su detalle.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-surface text-left text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium">Pedido</th>
                  <th className="hidden px-4 py-3 font-medium sm:table-cell">Cliente</th>
                  <th className="hidden px-4 py-3 font-medium md:table-cell">Pago</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const st = orderStatus(o.status);
                  const isCancelled = o.status === "CANCELLED";
                  return (
                    <tr key={o.id} className="border-b border-border last:border-0 hover:bg-surface">
                      <td className="px-4 py-3 text-muted">
                        {new Date(o.createdAt).toLocaleDateString("es-AR")}
                        <span className="block text-xs">
                          {new Date(o.createdAt).toLocaleTimeString("es-AR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/pedidos/${o.id}`}
                          className="font-medium text-fg hover:text-brand-500"
                        >
                          {o.orderNumber}
                        </Link>
                        <span className="block text-xs text-muted">
                          {o.items.length} {o.items.length === 1 ? "producto" : "productos"} ·{" "}
                          {DELIVERY_LABELS[o.deliveryMethod] ?? o.deliveryMethod}
                        </span>
                      </td>
                      <td className="hidden px-4 py-3 text-muted sm:table-cell">{o.customerName}</td>
                      <td className="hidden px-4 py-3 text-muted md:table-cell">
                        {PAYMENT_LABELS[o.paymentMethod] ?? o.paymentMethod}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${st.className}`}>
                          {st.label}
                        </span>
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-medium ${
                          isCancelled ? "text-muted line-through" : "text-fg"
                        }`}
                      >
                        {formatPrice(o.total)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
