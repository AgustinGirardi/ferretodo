import Link from "next/link";
import { ChevronRight, Inbox } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import { orderStatus, DELIVERY_LABELS } from "@/lib/order-status";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { items: true } } },
  });

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-fg">Pedidos</h1>
      <p className="mb-6 text-sm text-muted">{orders.length} pedidos recibidos</p>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
          <Inbox className="h-10 w-10 text-muted" />
          <p className="text-sm font-medium text-fg">Todavía no hay pedidos</p>
          <p className="max-w-xs text-sm text-muted">
            Cuando un cliente complete una compra, vas a verla acá.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-surface text-left text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Pedido</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Cliente</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Fecha</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const st = orderStatus(o.status);
                return (
                  <tr key={o.id} className="border-b border-border last:border-0 hover:bg-surface">
                    <td className="px-4 py-3">
                      <Link href={`/admin/pedidos/${o.id}`} className="font-medium text-fg hover:text-brand-500">
                        {o.orderNumber}
                      </Link>
                      <p className="text-xs text-muted">
                        {o._count.items} {o._count.items === 1 ? "producto" : "productos"} ·{" "}
                        {DELIVERY_LABELS[o.deliveryMethod] ?? o.deliveryMethod}
                      </p>
                    </td>
                    <td className="hidden px-4 py-3 text-muted sm:table-cell">{o.customerName}</td>
                    <td className="hidden px-4 py-3 text-muted md:table-cell">
                      {new Date(o.createdAt).toLocaleDateString("es-AR")}
                    </td>
                    <td className="px-4 py-3 font-medium text-fg">{formatPrice(o.total)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${st.className}`}>
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/pedidos/${o.id}`} className="text-muted hover:text-brand-500">
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
