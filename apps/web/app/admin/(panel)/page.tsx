import Link from "next/link";
import { ShoppingBag, AlertTriangle, BadgePercent, Plus, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import { orderStatus } from "@/lib/order-status";

export const dynamic = "force-dynamic";

async function getData() {
  const [products, lowStock, onSale, ordersCount, pending, revenueAgg, recent] = await Promise.all([
    prisma.product.count({ where: { deletedAt: null } }),
    prisma.product.count({ where: { deletedAt: null, stockQty: { lte: 5 } } }),
    prisma.product.count({ where: { deletedAt: null, previousPrice: { not: null } } }),
    prisma.order.count(),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.aggregate({ _sum: { total: true }, where: { status: { not: "CANCELLED" } } }),
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
  ]);
  return {
    products, lowStock, onSale, ordersCount, pending,
    revenue: revenueAgg._sum.total ?? 0,
    recent,
  };
}

export default async function AdminDashboard() {
  const d = await getData();

  const cards = [
    { label: "Pedidos", value: String(d.ordersCount), icon: ShoppingBag, href: "/admin/pedidos" },
    { label: "Pedidos nuevos", value: String(d.pending), icon: ShoppingBag, href: "/admin/pedidos" },
    { label: "Facturado", value: formatPrice(d.revenue), icon: BadgePercent, href: "/admin/pedidos" },
    { label: "Stock bajo", value: String(d.lowStock), icon: AlertTriangle, href: "/admin/productos" },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-fg">Inicio</h1>
          <p className="text-sm text-muted">Resumen de tu tienda</p>
        </div>
        <Link
          href="/admin/productos/nuevo"
          className="inline-flex items-center gap-2 rounded-md bg-brand-cta px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-cta-hover"
        >
          <Plus className="h-4 w-4" /> Agregar producto
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.label}
              href={c.href}
              className="rounded-xl border border-border bg-surface p-4 transition-colors hover:border-brand-500"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">{c.label}</span>
                <Icon className="h-4 w-4 text-muted" />
              </div>
              <div className="mt-2 text-2xl font-bold text-fg">{c.value}</div>
            </Link>
          );
        })}
      </div>

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-medium text-fg">Últimos pedidos</h2>
          <Link href="/admin/pedidos" className="text-sm text-brand-500 hover:underline">
            Ver todos
          </Link>
        </div>

        {d.recent.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted">
            Todavía no hay pedidos. Cuando un cliente compre, aparecerán acá.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border">
            {d.recent.map((o) => {
              const st = orderStatus(o.status);
              return (
                <Link
                  key={o.id}
                  href={`/admin/pedidos/${o.id}`}
                  className="flex items-center justify-between border-b border-border px-4 py-3 last:border-0 hover:bg-surface"
                >
                  <div>
                    <p className="font-medium text-fg">{o.orderNumber}</p>
                    <p className="text-xs text-muted">{o.customerName}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`hidden rounded-full px-2.5 py-1 text-xs font-medium sm:inline-block ${st.className}`}>
                      {st.label}
                    </span>
                    <span className="font-medium text-fg">{formatPrice(o.total)}</span>
                    <ChevronRight className="h-4 w-4 text-muted" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
