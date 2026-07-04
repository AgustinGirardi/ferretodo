import { getAdminSession } from "@/lib/auth";
import { asPeriod, getOrdersForPeriod } from "@/lib/sales";
import { orderStatus, PAYMENT_LABELS, DELIVERY_LABELS } from "@/lib/order-status";

export const dynamic = "force-dynamic";

// Campo CSV escapado; el prefijo ' evita que Excel ejecute fórmulas (=, +, -, @).
function esc(v: string): string {
  const safe = /^[=+\-@]/.test(v) ? `'${v}` : v;
  return `"${safe.replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) return new Response("No autorizado", { status: 401 });

  const periodo = asPeriod(new URL(request.url).searchParams.get("periodo") ?? undefined);
  const orders = await getOrdersForPeriod(periodo);

  const header = [
    "Fecha", "Pedido", "Cliente", "Email", "Teléfono", "Entrega", "Zona",
    "Dirección", "Pago", "Estado", "Subtotal", "Envío", "Descuento", "Total",
  ];
  const rows = orders.map((o) =>
    [
      esc(new Date(o.createdAt).toLocaleString("es-AR")),
      esc(o.orderNumber),
      esc(o.customerName),
      esc(o.customerEmail),
      esc(o.customerPhone),
      esc(DELIVERY_LABELS[o.deliveryMethod] ?? o.deliveryMethod),
      esc(o.zone ?? ""),
      esc(o.address ?? ""),
      esc(PAYMENT_LABELS[o.paymentMethod] ?? o.paymentMethod),
      esc(orderStatus(o.status).label),
      o.subtotal,
      o.shippingCost,
      o.discount,
      o.total,
    ].join(";"),
  );

  // BOM para que Excel abra el archivo con acentos correctos; ";" es el
  // separador que espera Excel en configuración regional es-AR.
  const csv = String.fromCharCode(0xfeff) + [header.join(";"), ...rows].join("\r\n");
  const date = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ventas-${periodo}-${date}.csv"`,
    },
  });
}
