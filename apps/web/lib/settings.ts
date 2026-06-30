import { prisma } from "./prisma";

/** Ajustes editables de la portada (home). Se guardan en SiteSetting (key/value). */
export interface HomeSettings {
  heroTitle: string;
  heroSubtitle: string;
  heroCtaLabel: string;
  heroCtaLink: string;
  heroImageUrl: string; // vacío => se muestra el ícono por defecto
}

export const HOME_DEFAULTS: HomeSettings = {
  heroTitle: "Herramientas y materiales para tu obra y tu casa",
  heroSubtitle:
    "Miles de productos de las mejores marcas, con stock real, envío en Río Cuarto y atención de profesionales.",
  heroCtaLabel: "Ver ofertas",
  heroCtaLink: "/ofertas",
  heroImageUrl: "",
};

const PREFIX = "home.";

export async function getHomeSettings(): Promise<HomeSettings> {
  const rows = await prisma.siteSetting.findMany({ where: { key: { startsWith: PREFIX } } });
  const map = Object.fromEntries(rows.map((r) => [r.key.slice(PREFIX.length), r.value]));
  return {
    heroTitle: map.heroTitle ?? HOME_DEFAULTS.heroTitle,
    heroSubtitle: map.heroSubtitle ?? HOME_DEFAULTS.heroSubtitle,
    heroCtaLabel: map.heroCtaLabel ?? HOME_DEFAULTS.heroCtaLabel,
    heroCtaLink: map.heroCtaLink ?? HOME_DEFAULTS.heroCtaLink,
    heroImageUrl: map.heroImageUrl ?? HOME_DEFAULTS.heroImageUrl,
  };
}

export async function saveHomeSettings(values: HomeSettings): Promise<void> {
  await Promise.all(
    Object.entries(values).map(([k, v]) =>
      prisma.siteSetting.upsert({
        where: { key: PREFIX + k },
        update: { value: v },
        create: { key: PREFIX + k, value: v },
      }),
    ),
  );
}
