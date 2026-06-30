import { formatPrice } from "./format";
import type { CartItem } from "./cart-store";

export function cartSubtotal(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.price * i.qty, 0);
}

/** Costo de envío estimado por zona de Río Cuarto. */
export const shippingZones: Record<string, { label: string; cost: number }> = {
  pickup: { label: "Retiro en el local (gratis)", cost: 0 },
  centro: { label: "Centro", cost: 2500 },
  norte: { label: "Zona norte", cost: 3500 },
  sur: { label: "Zona sur", cost: 3500 },
  afueras: { label: "Afueras / interior", cost: 5000 },
};

/** Mensaje de WhatsApp con el detalle del carrito (para presupuesto/consulta). */
export function cartWhatsappMessage(items: CartItem[]): string {
  if (items.length === 0) return "Hola FERRETODO, quería hacer una consulta.";
  const detail = items
    .map((i) => `• ${i.qty}x ${i.name} — ${formatPrice(i.price * i.qty)}`)
    .join("\n");
  const total = formatPrice(cartSubtotal(items));
  return `Hola FERRETODO, quería un presupuesto por:\n${detail}\n\nSubtotal: ${total}`;
}
