"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { isRateLimited } from "@/lib/rate-limit";
import { sendSimpleEmail } from "@/lib/email";
import { escapeHtml } from "@/lib/email-template";
import { site } from "@/lib/site";
import { isValidEmail } from "@/lib/validation";

export interface WithdrawalState {
  ok?: boolean;
  code?: string;
  error?: string;
}

async function uniqueCode(): Promise<string> {
  const year = new Date().getFullYear();
  while (true) {
    const n = Math.floor(10000 + Math.random() * 90000);
    const candidate = `AR-${year}-${n}`;
    const existing = await prisma.withdrawalRequest.findUnique({ where: { code: candidate } });
    if (!existing) return candidate;
  }
}

export async function createWithdrawalRequest(
  _prev: WithdrawalState,
  formData: FormData,
): Promise<WithdrawalState> {
  const ip = ((await headers()).get("x-forwarded-for") ?? "local").split(",")[0]?.trim() || "local";
  if (isRateLimited(`withdrawal:${ip}`, 3, 60 * 60_000)) {
    return { error: "Ya enviaste varias solicitudes. Esperá un rato o llamanos al " + site.phone };
  }

  const name = String(formData.get("name") ?? "").trim().slice(0, 120);
  const email = String(formData.get("email") ?? "").trim().slice(0, 200);
  const phone = String(formData.get("phone") ?? "").trim().slice(0, 40);
  const orderNumber = String(formData.get("orderNumber") ?? "").trim().slice(0, 40);
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 1000);

  if (!name || !email) return { error: "Completá tu nombre y tu email." };
  if (!isValidEmail(email)) return { error: "El email no parece válido." };

  const code = await uniqueCode();
  await prisma.withdrawalRequest.create({
    data: { code, orderNumber, name, email, phone, reason },
  });

  const detailHtml = `
    <p>Constancia: <strong>${escapeHtml(code)}</strong></p>
    <p>Nombre: ${escapeHtml(name)}<br/>
    Email: ${escapeHtml(email)}<br/>
    Teléfono: ${escapeHtml(phone || "-")}<br/>
    Pedido: ${escapeHtml(orderNumber || "-")}<br/>
    Motivo: ${escapeHtml(reason || "-")}</p>`;

  // Avisos por email (best effort: la solicitud ya quedó registrada en la base).
  const storeEmail = process.env.STORE_EMAIL;
  if (storeEmail) {
    await sendSimpleEmail(
      storeEmail,
      `Botón de arrepentimiento: solicitud ${code}`,
      `<p>Se recibió una solicitud de arrepentimiento en la tienda.</p>${detailHtml}
       <p>Recordá responder y gestionar la devolución dentro de las 24 hs.</p>`,
    );
  }
  await sendSimpleEmail(
    email,
    `Constancia de arrepentimiento ${code} — ${site.name}`,
    `<p>Hola ${escapeHtml(name)}, recibimos tu solicitud de arrepentimiento.</p>${detailHtml}
     <p>Nos vamos a contactar a la brevedad para coordinar la devolución.
     Ante cualquier duda escribinos o llamanos al ${site.phone}.</p>`,
  );

  return { ok: true, code };
}
