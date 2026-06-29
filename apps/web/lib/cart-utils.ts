import { getProductById } from "./catalog";
import { formatPrice } from "./format";
import type { CartLine } from "./cart-store";
import type { MockProduct } from "./catalog-data";

export interface ResolvedLine {
  product: MockProduct;
  qty: number;
  lineTotal: number;
}

/** Une las líneas del carrito (id + qty) con los datos del producto. */
export function resolveCart(items: CartLine[]): ResolvedLine[] {
  return items
    .map((i) => {
      const product = getProductById(i.id);
      return product ? { product, qty: i.qty, lineTotal: product.price * i.qty } : null;
    })
    .filter((l): l is ResolvedLine => l !== null);
}

export function cartSubtotal(items: CartLine[]): number {
  return resolveCart(items).reduce((sum, l) => sum + l.lineTotal, 0);
}

/** Costo de envío estimado por zona de Río Cuarto (mock). */
export const shippingZones: Record<string, { label: string; cost: number }> = {
  pickup: { label: "Retiro en el local (gratis)", cost: 0 },
  centro: { label: "Centro", cost: 2500 },
  norte: { label: "Zona norte", cost: 3500 },
  sur: { label: "Zona sur", cost: 3500 },
  afueras: { label: "Afueras / interior", cost: 5000 },
};

/** Mensaje de WhatsApp con el detalle del carrito (para presupuesto/consulta). */
export function cartWhatsappMessage(items: CartLine[]): string {
  const lines = resolveCart(items);
  if (lines.length === 0) return "Hola FERRETODO, quería hacer una consulta.";
  const detail = lines
    .map((l) => `• ${l.qty}x ${l.product.name} — ${formatPrice(l.lineTotal)}`)
    .join("\n");
  const total = formatPrice(cartSubtotal(items));
  return `Hola FERRETODO, quería un presupuesto por:\n${detail}\n\nSubtotal: ${total}`;
}
