"use server";

import { prisma } from "@/lib/prisma";
import { shippingZones } from "@/lib/cart-utils";
import { sendOrderConfirmation } from "@/lib/email";
import { DELIVERY_LABELS, PAYMENT_LABELS } from "@/lib/order-status";

export interface CreateOrderInput {
  customer: { name: string; email: string; phone: string };
  delivery: { method: "pickup" | "delivery"; zone?: string; address?: string };
  payment: "mercadopago" | "transfer" | "cash";
  items: { productId: string; qty: number }[];
}

export interface CreateOrderResult {
  ok: boolean;
  orderNumber?: string;
  total?: number;
  error?: string;
}

async function uniqueOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  while (true) {
    const n = Math.floor(10000 + Math.random() * 90000);
    const candidate = `FT-${year}-${n}`;
    const existing = await prisma.order.findUnique({ where: { orderNumber: candidate } });
    if (!existing) return candidate;
  }
}

export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  if (!input.customer?.name || !input.customer?.email || !input.customer?.phone) {
    return { ok: false, error: "Faltan datos del comprador." };
  }
  if (!input.items?.length) return { ok: false, error: "El carrito está vacío." };

  // Recalcular SIEMPRE en el servidor (no se confía en los precios del cliente).
  const products = await prisma.product.findMany({
    where: { id: { in: input.items.map((i) => i.productId) } },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  const lines = input.items
    .map((i) => {
      const p = byId.get(i.productId);
      const qty = Math.max(1, Math.round(i.qty));
      if (!p) return null;
      return {
        productId: p.id,
        productName: p.name,
        unitPrice: p.price,
        quantity: qty,
        lineTotal: p.price * qty,
      };
    })
    .filter((l): l is NonNullable<typeof l> => l !== null);

  if (lines.length === 0) return { ok: false, error: "Los productos ya no están disponibles." };

  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const shippingCost =
    input.delivery.method === "delivery"
      ? (shippingZones[input.delivery.zone ?? ""]?.cost ?? 0)
      : 0;
  const discount = input.payment === "transfer" ? Math.round(subtotal * 0.05) : 0;
  const total = subtotal + shippingCost - discount;

  const order = await prisma.order.create({
    data: {
      orderNumber: await uniqueOrderNumber(),
      customerName: input.customer.name,
      customerEmail: input.customer.email,
      customerPhone: input.customer.phone,
      deliveryMethod: input.delivery.method,
      zone: input.delivery.zone ?? null,
      address: input.delivery.address ?? null,
      paymentMethod: input.payment,
      subtotal,
      shippingCost,
      discount,
      total,
      items: { create: lines },
    },
  });

  // Email de confirmación (no bloquea: si falla, el pedido se crea igual).
  try {
    await sendOrderConfirmation({
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      items: lines.map((l) => ({ name: l.productName, qty: l.quantity, lineTotal: l.lineTotal })),
      subtotal,
      shippingCost,
      discount,
      total,
      deliveryLabel: DELIVERY_LABELS[order.deliveryMethod] ?? order.deliveryMethod,
      paymentLabel: PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod,
    });
  } catch (e) {
    console.error("[checkout] no se pudo enviar el email de confirmación:", e);
  }

  return { ok: true, orderNumber: order.orderNumber, total: order.total };
}
