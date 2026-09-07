import { cache } from "react";
import { prisma } from "./prisma";

/** Ajustes editables de la home (portada). Se guardan en SiteSetting (key/value). */
export interface HomeSettings {
  heroTitle: string;
  heroSubtitle: string;
  heroCtaLabel: string;
  heroCtaLink: string;
  heroImageUrl: string; // vacío => se muestra el ícono por defecto
  // Franja de beneficios (los íconos son fijos)
  benefit1Title: string;
  benefit1Text: string;
  benefit2Title: string;
  benefit2Text: string;
  benefit3Title: string;
  benefit3Text: string;
  benefit4Title: string;
  benefit4Text: string;
  // Títulos de secciones
  featuredTitle: string;
  bestSellersTitle: string;
}

export const HOME_DEFAULTS: HomeSettings = {
  heroTitle: "Herramientas y materiales para tu obra y tu casa",
  heroSubtitle:
    "Miles de productos de las mejores marcas, con stock real, envío en Río Cuarto y atención de profesionales.",
  heroCtaLabel: "Ver ofertas",
  heroCtaLink: "/ofertas",
  heroImageUrl: "",
  benefit1Title: "Envíos en Río Cuarto",
  benefit1Text: "Costo por zona, rápido y seguro",
  benefit2Title: "Hasta 12 cuotas",
  benefit2Text: "Con tarjeta o Mercado Pago",
  benefit3Title: "Retiro en el local",
  benefit3Text: "Comprá online, retirá hoy",
  benefit4Title: "Atención profesional",
  benefit4Text: "Te asesoramos por WhatsApp",
  featuredTitle: "Destacados",
  bestSellersTitle: "Más vendidos",
};

const PREFIX = "home.";

/** Igual que getCategories: la piden la home, el hero y la franja de beneficios,
 *  y sin cache() eran tres consultas idénticas por carga. */
export const getHomeSettings = cache(async (): Promise<HomeSettings> => {
  const rows = await prisma.siteSetting.findMany({ where: { key: { startsWith: PREFIX } } });
  const map = Object.fromEntries(rows.map((r) => [r.key.slice(PREFIX.length), r.value]));
  const get = (k: keyof HomeSettings) => map[k] ?? HOME_DEFAULTS[k];
  return {
    heroTitle: get("heroTitle"),
    heroSubtitle: get("heroSubtitle"),
    heroCtaLabel: get("heroCtaLabel"),
    heroCtaLink: get("heroCtaLink"),
    heroImageUrl: get("heroImageUrl"),
    benefit1Title: get("benefit1Title"),
    benefit1Text: get("benefit1Text"),
    benefit2Title: get("benefit2Title"),
    benefit2Text: get("benefit2Text"),
    benefit3Title: get("benefit3Title"),
    benefit3Text: get("benefit3Text"),
    benefit4Title: get("benefit4Title"),
    benefit4Text: get("benefit4Text"),
    featuredTitle: get("featuredTitle"),
    bestSellersTitle: get("bestSellersTitle"),
  };
});

export async function saveHomeSettings(values: HomeSettings): Promise<void> {
  // En transacción y no con Promise.all: SQLite serializa las escrituras, así
  // que los 15 upserts en paralelo compiten por el mismo lock (SQLITE_BUSY) y,
  // si uno falla, la portada queda guardada a medias.
  await prisma.$transaction(
    Object.entries(values).map(([k, v]) =>
      prisma.siteSetting.upsert({
        where: { key: PREFIX + k },
        update: { value: v },
        create: { key: PREFIX + k, value: v },
      }),
    ),
  );
}
