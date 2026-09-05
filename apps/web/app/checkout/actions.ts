"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { clientIp } from "@/lib/client-ip";
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
  /** Total que el cliente vio en pantalla. Si no coincide con el recalculado en
   *  el server (cambió un precio), se rechaza para no cobrar un monto distinto.
   *  Se omite en el reintento ("acepto el precio nuevo"). */
  expectedTotal?: number;
}

export interface CreateOrderResult {
  ok: boolean;
  orderNumber?: string;
  total?: number;
  error?: string;
  /** true cuando el rechazo fue por cambio de precio: el cliente confirma de nuevo. */
  priceChanged?: boolean;
}

/**
 * Número visible del pedido. Consultar primero y crear después no alcanza: entre
 * las dos operaciones otro pedido simultáneo puede tomar el mismo número y la
 * creación revienta contra el índice único. El chequeo evita la mayoría de los
 * choques; la garantía real es el reintento de la transacción (ver más abajo).
 */
async function candidateOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  for (let i = 0; i < 10; i++) {
    const n = Math.floor(10000 + Math.random() * 90000);
    const candidate = `FT-${year}-${n}`;
    const existing = await prisma.order.findUnique({ where: { orderNumber: candidate } });
    if (!existing) return candidate;
  }
  // Todos los candidatos estaban tomados (el año se llenó): se agrega sufijo.
  return `FT-${year}-${Math.floor(10000 + Math.random() * 90000)}-${Date.now() % 1000}`;
}

/** true si el error es "ya existe un pedido con ese orderNumber". */
function isOrderNumberClash(e: unknown): boolean {
  if (!(e instanceof Prisma.PrismaClientKnownRequestError) || e.code !== "P2002") return false;
  const target = e.meta?.target;
  const fields = Array.isArray(target) ? target.join(",") : String(target ?? "");
  return fields.includes("orderNumber");
}

const DELIVERY_ZONES = ["centro", "norte", "sur", "afueras"];
const MAX_ITEMS = 50;
const MAX_QTY = 999;

export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  const ip = await clientIp();

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

  // Si algún producto del carrito ya no está disponible (dado de baja o borrado
  // entre que se agregó y el confirm), NO se crea un pedido parcial en silencio:
  // se rechaza para que el cliente revise y no crea que compró algo que no compró.
  if (input.items.some((i) => !byId.has(i.productId))) {
    return {
      ok: false,
      error: "Uno o más productos del carrito ya no están disponibles. Revisalo antes de confirmar.",
    };
  }

  const lines = input.items.map((i) => {
    const p = byId.get(i.productId)!;
    const qty = Math.min(MAX_QTY, Math.max(1, Math.round(Number(i.qty) || 1)));
    return {
      productId: p.id,
      productName: p.name,
      unitPrice: p.price,
      quantity: qty,
      lineTotal: p.price * qty,
    };
  });

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

  // Si el total recalculado no coincide con el que el cliente vio (cambió un
  // precio mientras compraba), se rechaza para no cobrar un monto distinto al
  // mostrado. El cliente confirma de nuevo (sin expectedTotal) aceptando el nuevo.
  if (typeof input.expectedTotal === "number" && input.expectedTotal !== total) {
    return {
      ok: false,
      priceChanged: true,
      total,
      error: `Los precios se actualizaron. El nuevo total es $ ${total.toLocaleString("es-AR")}. Confirmá de nuevo para continuar.`,
    };
  }

  // Rate limit acá (no al entrar): máximo 5 pedidos cada 10 min por conexión.
  // Se cuenta solo el pedido que pasó todas las validaciones, así un cliente
  // que ajusta el carrito ante errores de stock/precio no queda bloqueado.
  if (isRateLimited(`order:${ip}`, 5, 10 * 60_000)) {
    return { ok: false, error: "Demasiados pedidos seguidos. Esperá unos minutos e intentá de nuevo." };
  }

  // Si el comprador tiene sesión de cliente, el pedido queda vinculado a su
  // cuenta (así "Mis pedidos" no depende del email autoafirmado). getCustomerSession
  // ya comprueba contra la base que la cuenta siga existiendo, así que si la DB se
  // restauró de un backup y la fila no está, devuelve null y el pedido se guarda
  // sin customerId en vez de romper por la clave foránea.
  const customerSession = await getCustomerSession();
  const customerId = customerSession?.sub ?? null;
  let order;
  // Si dos pedidos simultáneos sacan el mismo número, el índice único hace fallar
  // a uno de los dos. La transacción ya revirtió el descuento de stock, así que
  // reintentar con otro número es seguro: antes ese comprador veía "no pudimos
  // registrar el pedido" por un choque de números que no tenía nada que ver con él.
  for (let attempt = 0; ; attempt++) {
    const orderNumber = await candidateOrderNumber();
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
      break;
    } catch (e) {
      if (isOrderNumberClash(e) && attempt < 4) continue;
      if (e instanceof Error && e.message.startsWith("SIN_STOCK:")) {
        const productName = e.message.slice("SIN_STOCK:".length);
        return { ok: false, error: `"${productName}" se quedó sin stock justo ahora. Revisá el carrito.` };
      }
      console.error("[checkout] no se pudo registrar el pedido:", e);
      return { ok: false, error: "No pudimos registrar el pedido. Probá de nuevo en unos minutos." };
    }
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
      paymentMethod: order.paymentMethod,
    });
  } catch (e) {
    console.error("[checkout] no se pudo enviar el email de confirmación:", e);
  }

  return { ok: true, orderNumber: order.orderNumber, total: order.total };
}
