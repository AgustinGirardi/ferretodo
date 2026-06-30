"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { saveHomeSettings, type HomeSettings } from "@/lib/settings";

export interface PortadaState {
  saved?: boolean;
}

export async function savePortada(_prev: PortadaState, formData: FormData): Promise<PortadaState> {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const s = (k: string) => String(formData.get(k) ?? "").trim();
  const values: HomeSettings = {
    heroTitle: s("heroTitle"),
    heroSubtitle: s("heroSubtitle"),
    heroCtaLabel: s("heroCtaLabel"),
    heroCtaLink: s("heroCtaLink"),
    heroImageUrl: s("heroImageUrl"),
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
