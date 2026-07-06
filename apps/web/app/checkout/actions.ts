"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { shippingZones } from "@/lib/cart-utils";
import { sendOrderConfirmation } from "@/lib/email";
import { DELIVERY_LABELS, PAYMENT_LABELS } from "@/lib/order-status";
import { isRateLimited } from "@/lib/rate-limit";
import { EMAIL_RE } from "@/lib/validation";
import { getCustomerSession } from "@/lib/customer-auth";

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

const DELIVERY_ZONES = ["centro", "norte", "sur", "afueras"];
const MAX_ITEMS = 50;
const MAX_QTY = 999;

export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  // Máximo 5 pedidos cada 10 minutos por conexión (frena spam de pedidos/emails).
  const ip = ((await headers()).get("x-forwarded-for") ?? "local").split(",")[0]?.trim() || "local";
  if (isRateLimited(`order:${ip}`, 5, 10 * 60_000)) {
    return { ok: false, error: "Demasiados pedidos seguidos. Esperá unos minutos e intentá de nuevo." };
  }

  const name = String(input.customer?.name ?? "").trim();
  const email = String(input.customer?.email ?? "").trim();
  const phone = String(input.customer?.phone ?? "").trim();
  if (!name || !email || !phone) {
    return { ok: false, error: "Faltan datos del comprador." };
  }
  const phoneDigits = (phone.match(/\d/g) ?? []).length;
  if (
    name.length > 120 ||
    name.trim().length < 3 ||
    phone.length > 40 ||
    phoneDigits < 6 ||
    email.length > 200 ||
    !EMAIL_RE.test(email)
  ) {
    return { ok: false, error: "Revisá los datos del comprador (nombre, email o teléfono no parecen válidos)." };
  }

  const isDelivery = input.delivery?.method === "delivery";
  if (!isDelivery && input.delivery?.method !== "pickup") {
    return { ok: false, error: "Método de entrega inválido." };
  }
  const zone = String(input.delivery.zone ?? "").trim();
  const address = String(input.delivery.address ?? "").trim();
  if (isDelivery) {
    if (!DELIVERY_ZONES.includes(zone)) return { ok: false, error: "Elegí una zona de envío válida." };
    if (!address || address.length > 300) return { ok: false, error: "Completá la dirección de envío." };
  }
  if (!["mercadopago", "transfer", "cash"].includes(input.payment)) {
    return { ok: false, error: "Forma de pago inválida." };
  }
  if (isDelivery && input.payment === "cash") {
    return { ok: false, error: "El pago en efectivo solo está disponible con retiro en el local." };
  }

  if (!input.items?.length) return { ok: false, error: "El carrito está vacío." };
  if (input.items.length > MAX_ITEMS) {
    return { ok: false, error: "El carrito tiene demasiados productos distintos." };
  }

  // Recalcular SIEMPRE en el servidor (no se confía en los precios del cliente).
  // Solo productos activos y no borrados.
  const products = await prisma.product.findMany({
    where: {
      id: { in: input.items.map((i) => i.productId) },
      isActive: true,
      deletedAt: null,
    },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  const lines = input.items
    .map((i) => {
      const p = byId.get(i.productId);
      const qty = Math.min(MAX_QTY, Math.max(1, Math.round(Number(i.qty) || 1)));
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

  // Validación de stock con mensaje claro antes de intentar el descuento.
  for (const l of lines) {
    const p = byId.get(l.productId)!;
    if (p.stockQty < l.quantity) {
      return {
        ok: false,
        error:
          p.stockQty <= 0
            ? `"${p.name}" se quedó sin stock. Quitalo del carrito para continuar.`
            : `De "${p.name}" quedan ${p.stockQty} ${p.stockQty === 1 ? "unidad" : "unidades"} (pediste ${l.quantity}).`,
      };
    }
  }

  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  // La zona ya fue validada contra DELIVERY_ZONES; el ?? 0 es solo para TypeScript.
  const shippingCost = isDelivery ? (shippingZones[zone]?.cost ?? 0) : 0;
  const discount = input.payment === "transfer" ? Math.round(subtotal * 0.05) : 0;
  const total = subtotal + shippingCost - discount;

  const orderNumber = await uniqueOrderNumber();
  // Si el comprador tiene sesión de cliente, el pedido queda vinculado a su
  // cuenta (así "Mis pedidos" no depende del email, que no está verificado).
  const customerSession = await getCustomerSession();
  const customerId = customerSession?.sub ?? null;
  let order;
  try {
    // El pedido y el descuento de stock son una sola transacción: si otro
    // pedido simultáneo se llevó el stock, se revierte todo.
    order = await prisma.$transaction(async (tx) => {
      for (const l of lines) {
        const res = await tx.product.updateMany({
          where: { id: l.productId, stockQty: { gte: l.quantity } },
          data: { stockQty: { decrement: l.quantity } },
        });
        if (res.count === 0) throw new Error(`SIN_STOCK:${l.productName}`);
      }
      return tx.order.create({
        data: {
          orderNumber,
          customerName: name,
          customerEmail: email,
          customerPhone: phone,
          deliveryMethod: input.delivery.method,
          zone: isDelivery ? zone : null,
          address: isDelivery ? address : null,
          paymentMethod: input.payment,
          subtotal,
          shippingCost,
          discount,
          total,
          customerId,
          items: { create: lines },
        },
      });
    });
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("SIN_STOCK:")) {
      const productName = e.message.slice("SIN_STOCK:".length);
      return { ok: false, error: `"${productName}" se quedó sin stock justo ahora. Revisá el carrito.` };
    }
    console.error("[checkout] no se pudo registrar el pedido:", e);
    return { ok: false, error: "No pudimos registrar el pedido. Probá de nuevo en unos minutos." };
  }

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
