"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { saveHomeSettings, type HomeSettings } from "@/lib/settings";

export interface PortadaState {
  saved?: boolean;
  error?: string;
}

/**
 * La imagen del banner va a <Image> de next/image, que solo acepta los dominios
 * de next.config.mjs: una URL de otro lado hacía que el componente lanzara y la
 * home entera devolviera 500. Solo se acepta una foto subida desde el panel.
 */
function cleanImageUrl(value: string): string | null {
  if (!value) return "";
  return /^\/uploads\/[A-Za-z0-9-]+\.[a-z0-9]+$/.test(value) ? value : null;
}

/**
 * El link del botón tiene que ser una ruta interna: nada de javascript: ni de
 * mandar al visitante afuera del sitio desde el botón principal de la home.
 *
 * Se resuelve contra un origen ficticio y se exige que no haya cambiado de
 * origen. Un simple regex de "empieza con /" no alcanza: "//otro.com" también
 * empieza con barra y es una URL protocol-relative que sale del sitio, igual
 * que "/\otro.com", porque el parser trata la barra invertida como barra.
 */
const CTA_BASE = "https://ferretodo.invalid";

function cleanCtaLink(value: string): string | null {
  if (!value) return "";
  if (!value.startsWith("/")) return null;
  try {
    const url = new URL(value, CTA_BASE);
    if (url.origin !== CTA_BASE) return null;
    return url.pathname + url.search;
  } catch {
    return null;
  }
}

export async function savePortada(_prev: PortadaState, formData: FormData): Promise<PortadaState> {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const s = (k: string) => String(formData.get(k) ?? "").trim();

  const heroImageUrl = cleanImageUrl(s("heroImageUrl"));
  if (heroImageUrl === null) {
    return { error: "La imagen del banner tiene que ser una foto subida desde acá." };
  }
  const heroCtaLink = cleanCtaLink(s("heroCtaLink"));
  if (heroCtaLink === null) {
    return { error: "El link del botón tiene que ser una ruta de la tienda, por ejemplo /ofertas." };
  }
  const values: HomeSettings = {
    heroTitle: s("heroTitle"),
    heroSubtitle: s("heroSubtitle"),
    heroCtaLabel: s("heroCtaLabel"),
    heroCtaLink,
    heroImageUrl,
    benefit1Title: s("benefit1Title"),
    benefit1Text: s("benefit1Text"),
    benefit2Title: s("benefit2Title"),
    benefit2Text: s("benefit2Text"),
    benefit3Title: s("benefit3Title"),
    benefit3Text: s("benefit3Text"),
    benefit4Title: s("benefit4Title"),
    benefit4Text: s("benefit4Text"),
    featuredTitle: s("featuredTitle"),
    bestSellersTitle: s("bestSellersTitle"),
  };

  await saveHomeSettings(values);
  revalidatePath("/");
  revalidatePath("/admin/portada");
  return { saved: true };
}
