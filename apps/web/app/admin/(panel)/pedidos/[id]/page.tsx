import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, User, Mail, Phone, Truck, Store, MapPin, CreditCard } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import { DELIVERY_LABELS, PAYMENT_LABELS } from "@/lib/order-status";
import { OrderStatusSelect } from "@/components/admin/order-status-select";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) notFound();

  const isDelivery = order.deliveryMethod === "delivery";

  return (
    <div>
      <Link href="/admin/pedidos" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-fg">
        <ArrowLeft className="h-4 w-4" /> Volver a pedidos
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-fg">{order.orderNumber}</h1>
          <p className="text-sm text-muted">{new Date(order.createdAt).toLocaleString("es-AR")}</p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted">Estado:</span>
          <OrderStatusSelect id={order.id} status={order.status} />
        </label>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Items */}
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-surface text-left text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Producto</th>
                <th className="px-4 py-3 font-medium">Cant.</th>
                <th className="px-4 py-3 text-right font-medium">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((it) => (
                <tr key={it.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-fg">
                    {it.productName}
                    <span className="block text-xs text-muted">{formatPrice(it.unitPrice)} c/u</span>
                  </td>
                  <td className="px-4 py-3 text-muted">{it.quantity}</td>
                  <td className="px-4 py-3 text-right font-medium text-fg">{formatPrice(it.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <dl className="space-y-1.5 border-t border-border p-4 text-sm">
            <Row label="Subtotal" value={formatPrice(order.subtotal)} />
            <Row label="Envío" value={order.shippingCost ? formatPrice(order.shippingCost) : "Gratis"} />
            {order.discount > 0 && <Row label="Descuento" value={`-${formatPrice(order.discount)}`} />}
            <div className="flex justify-between border-t border-border pt-2 text-base font-bold text-fg">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </dl>
        </div>

        {/* Cliente + entrega + pago */}
        <aside className="flex flex-col gap-4">
          <Card title="Cliente">
            <Line icon={<User className="h-4 w-4" />} text={order.customerName} />
            <Line icon={<Mail className="h-4 w-4" />} text={order.customerEmail} />
            <Line icon={<Phone className="h-4 w-4" />} text={order.customerPhone} />
          </Card>

          <Card title="Entrega">
            <Line
              icon={isDelivery ? <Truck className="h-4 w-4" /> : <Store className="h-4 w-4" />}
              text={DELIVERY_LABELS[order.deliveryMethod] ?? order.deliveryMethod}
            />
            {isDelivery && order.address && (
              <Line icon={<MapPin className="h-4 w-4" />} text={`${order.address}${order.zone ? ` (${order.zone})` : ""}`} />
            )}
          </Card>

          <Card title="Pago">
            <Line icon={<CreditCard className="h-4 w-4" />} text={PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod} />
          </Card>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted">{label}</dt>
      <dd className="text-fg">{value}</dd>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <h2 className="mb-3 text-sm font-medium text-fg">{title}</h2>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function Line({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span className="flex items-center gap-2 text-sm text-muted">
      <span className="text-muted">{icon}</span>
      <span className="text-fg">{text}</span>
    </span>
  );
}
