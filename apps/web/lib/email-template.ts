import { site } from "./site";
import { formatPrice } from "./format";

export interface OrderEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: { name: string; qty: number; lineTotal: number }[];
  subtotal: number;
  shippingCost: number;
  discount: number;
  total: number;
  deliveryLabel: string;
  paymentLabel: string;
}

const BRAND = "#d94e04";
const SLATE = "#0f172a";
const MUTED = "#64748b";
const BORDER = "#e2e8f0";

/** HTML del email de confirmación (apto para clientes de correo: tablas + estilos inline). */
export function renderOrderEmail(d: OrderEmailData): string {
  const rows = d.items
    .map(
      (i) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid ${BORDER};color:${SLATE};font-size:14px;">
          ${escape(i.name)} <span style="color:${MUTED};">× ${i.qty}</span>
        </td>
        <td style="padding:10px 0;border-bottom:1px solid ${BORDER};color:${SLATE};font-size:14px;text-align:right;white-space:nowrap;">
          ${formatPrice(i.lineTotal)}
        </td>
      </tr>`,
    )
    .join("");

  const discountRow =
    d.discount > 0
      ? `<tr><td style="padding:4px 0;color:#16a34a;font-size:14px;">Descuento</td>
         <td style="padding:4px 0;color:#16a34a;font-size:14px;text-align:right;">-${formatPrice(d.discount)}</td></tr>`
      : "";

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid ${BORDER};">

        <tr><td style="background:${SLATE};padding:20px 28px;">
          <span style="font-size:22px;font-weight:bold;color:#ffffff;letter-spacing:-.5px;">FERRE<span style="color:${BRAND};">TODO</span></span>
        </td></tr>

        <tr><td style="padding:28px;">
          <h1 style="margin:0 0 6px;font-size:20px;color:${SLATE};">¡Gracias por tu compra, ${escape(firstName(d.customerName))}!</h1>
          <p style="margin:0 0 4px;font-size:14px;color:${MUTED};">Recibimos tu pedido y lo estamos preparando.</p>
          <p style="margin:0 0 20px;font-size:14px;color:${SLATE};">Número de pedido: <strong>${escape(d.orderNumber)}</strong></p>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px;">
            <tr><td style="padding:4px 0;color:${MUTED};font-size:14px;">Subtotal</td>
                <td style="padding:4px 0;color:${SLATE};font-size:14px;text-align:right;">${formatPrice(d.subtotal)}</td></tr>
            <tr><td style="padding:4px 0;color:${MUTED};font-size:14px;">Envío</td>
                <td style="padding:4px 0;color:${SLATE};font-size:14px;text-align:right;">${d.shippingCost ? formatPrice(d.shippingCost) : "Gratis"}</td></tr>
            ${discountRow}
            <tr><td style="padding:10px 0 0;border-top:2px solid ${BORDER};color:${SLATE};font-size:16px;font-weight:bold;">Total</td>
                <td style="padding:10px 0 0;border-top:2px solid ${BORDER};color:${SLATE};font-size:16px;font-weight:bold;text-align:right;">${formatPrice(d.total)}</td></tr>
          </table>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;background:#f8fafc;border-radius:8px;">
            <tr><td style="padding:16px;">
              <p style="margin:0 0 4px;font-size:13px;color:${MUTED};">Entrega</p>
              <p style="margin:0 0 12px;font-size:14px;color:${SLATE};">${escape(d.deliveryLabel)}</p>
              <p style="margin:0 0 4px;font-size:13px;color:${MUTED};">Forma de pago</p>
              <p style="margin:0;font-size:14px;color:${SLATE};">${escape(d.paymentLabel)}</p>
            </td></tr>
          </table>

          <p style="margin:24px 0 0;font-size:13px;color:${MUTED};line-height:1.6;">
            Te vamos a contactar para coordinar la entrega. Ante cualquier duda, escribinos por WhatsApp al ${site.phone}.
          </p>
        </td></tr>

        <tr><td style="background:${SLATE};padding:20px 28px;">
          <p style="margin:0;font-size:13px;color:#cbd5e1;">${site.name} · ${site.tagline}</p>
          <p style="margin:4px 0 0;font-size:12px;color:#94a3b8;">${site.address} · Tel ${site.phone}</p>
        </td></tr>

      </table>
      <p style="margin:16px 0 0;font-size:11px;color:#94a3b8;">Este email se envió a ${escape(d.customerEmail)} por tu compra en FERRETODO.</p>
    </td></tr>
  </table>
</body>
</html>`;
}

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || name;
}

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Escape de HTML para contenido de usuario en emails. */
export const escapeHtml = escape;
