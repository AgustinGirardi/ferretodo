import { Resend } from "resend";
import { renderOrderEmail, type OrderEmailData } from "./email-template";

export interface SendResult {
  sent: boolean;
  simulated: boolean;
}

/**
 * Envía el email de confirmación al cliente (y notifica a la tienda si hay
 * STORE_EMAIL). Si no hay RESEND_API_KEY, lo "simula" (lo registra) para no
 * romper el flujo de compra. Nunca lanza: el pedido se crea igual aunque el
 * email falle.
 */
/** Email simple (avisos a la tienda, constancias). Nunca lanza. */
export async function sendSimpleEmail(
  to: string,
  subject: string,
  html: string,
): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "FERRETODO <onboarding@resend.dev>";

  if (!apiKey) {
    console.log(`[email] (simulado, falta RESEND_API_KEY) → ${to} · ${subject}`);
    return { sent: false, simulated: true };
  }

  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({ from, to, subject, html });
    return { sent: true, simulated: false };
  } catch (e) {
    console.error("[email] error al enviar:", e);
    return { sent: false, simulated: false };
  }
}

export async function sendOrderConfirmation(data: OrderEmailData): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "FERRETODO <onboarding@resend.dev>";
  const subject = `Tu pedido ${data.orderNumber} en FERRETODO`;

  if (!apiKey) {
    console.log(
      `[email] (simulado, falta RESEND_API_KEY) → ${data.customerEmail} · ${subject}`,
    );
    return { sent: false, simulated: true };
  }

  try {
    const resend = new Resend(apiKey);
    const html = renderOrderEmail(data);

    await resend.emails.send({ from, to: data.customerEmail, subject, html });

    const storeEmail = process.env.STORE_EMAIL;
    if (storeEmail) {
      await resend.emails.send({
        from,
        to: storeEmail,
        subject: `Nuevo pedido ${data.orderNumber} (${data.customerName})`,
        html,
      });
    }
    return { sent: true, simulated: false };
  } catch (e) {
    console.error("[email] error al enviar la confirmación:", e);
    return { sent: false, simulated: false };
  }
}
