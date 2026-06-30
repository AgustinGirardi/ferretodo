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

  const values: HomeSettings = {
    heroTitle: String(formData.get("heroTitle") ?? "").trim(),
    heroSubtitle: String(formData.get("heroSubtitle") ?? "").trim(),
    heroCtaLabel: String(formData.get("heroCtaLabel") ?? "").trim(),
    heroCtaLink: String(formData.get("heroCtaLink") ?? "").trim(),
    heroImageUrl: String(formData.get("heroImageUrl") ?? "").trim(),
  };

  await saveHomeSettings(values);
  revalidatePath("/");
  revalidatePath("/admin/portada");
  return { saved: true };
}
