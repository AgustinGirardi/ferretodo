import { cache } from "react";
import { prisma } from "./prisma";
import type { IconName } from "./icons";
import type { SortOption } from "./sort";

export type { SortOption } from "./sort";
export { sortOptions } from "./sort";

export type StockStatus = "in" | "low" | "out";

export interface ProductSpec {
  name: string;
  value: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  categorySlug: string;
  categoryName: string;
  sku: string;
  price: number;
  previousPrice?: number;
  stock: StockStatus;
  stockQty: number;
  iconName: IconName;
  imageUrl?: string;
  shortDescription: string;
  longDescription: string;
  specs: ProductSpec[];
  tags: string[];
  rating: number;
  reviewCount: number;
  isFeatured: boolean;
  isNew: boolean;
  salesRank: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  iconName: IconName;
}

const VALID_ICONS = [
  "plug", "wrench", "hammer", "zap", "droplets",
  "paintBucket", "hardHat", "bolt", "shovel", "shieldCheck",
];

function asIcon(name: string): IconName {
  return (VALID_ICONS.includes(name) ? name : "bolt") as IconName;
}

function stockStatus(qty: number): StockStatus {
  if (qty <= 0) return "out";
  if (qty <= 5) return "low";
  return "in";
}

type DbProduct = NonNullable<Awaited<ReturnType<typeof prisma.product.findFirst>>> & {
  brand?: { name: string } | null;
  category?: { name: string; slug: string } | null;
};

function toProduct(p: DbProduct): Product {
  let specs: ProductSpec[] = [];
  try {
    specs = JSON.parse(p.specsJson || "[]");
  } catch {
    specs = [];
  }
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    brand: p.brand?.name ?? "",
    categorySlug: p.category?.slug ?? "",
    categoryName: p.category?.name ?? "",
    sku: p.sku,
    price: p.price,
    previousPrice: p.previousPrice ?? undefined,
    stock: stockStatus(p.stockQty),
    stockQty: p.stockQty,
    iconName: asIcon(p.iconName),
    imageUrl: p.imageUrl ?? undefined,
    shortDescription: p.shortDescription,
    longDescription: p.longDescription,
    specs,
    tags: p.tags ? p.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
    rating: p.rating,
    reviewCount: p.reviewCount,
    isFeatured: p.isFeatured,
    isNew: p.isNew,
    salesRank: p.salesRank,
  };
}

const include = { brand: true, category: true } as const;
const visible = { isActive: true, deletedAt: null } as const;

// ─────────────── Categorías y marcas ───────────────

/** Con cache() se consulta una sola vez por request, aunque la pidan el header,
 *  el footer y la grilla de categorías por separado. */
export const getCategories = cache(async (): Promise<Category[]> => {
  const cats = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { position: "asc" },
  });
  return cats.map((c) => ({ id: c.id, name: c.name, slug: c.slug, iconName: asIcon(c.iconName) }));
});

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const c = await prisma.category.findUnique({ where: { slug } });
  return c ? { id: c.id, name: c.name, slug: c.slug, iconName: asIcon(c.iconName) } : null;
}

/** Marcas que tienen al menos un producto visible. Se consultan las marcas, no
 *  todos los productos: antes traía el catálogo entero solo para juntar nombres. */
export const getBrandNames = cache(async (categorySlug?: string): Promise<string[]> => {
  const brands = await prisma.brand.findMany({
    where: {
      isActive: true,
      products: {
        some: { ...visible, ...(categorySlug ? { category: { slug: categorySlug } } : {}) },
      },
    },
    select: { name: true },
    orderBy: { name: "asc" },
  });
  return brands.map((b) => b.name);
});

// ─────────────── Consulta / filtros ───────────────

export interface CatalogQuery {
  category?: string;
  brands?: string[];
  minPrice?: number;
  maxPrice?: number;
  onSale?: boolean;
  inStock?: boolean;
  sort?: SortOption;
}

export function parseQuery(sp: Record<string, string | string[] | undefined>): CatalogQuery {
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const many = (v: string | string[] | undefined) =>
    v === undefined ? [] : Array.isArray(v) ? v : [v];
  const num = (v: string | string[] | undefined) => {
    const n = Number(one(v));
    return Number.isFinite(n) ? n : undefined;
  };
  return {
    category: one(sp.category),
    // Tope de marcas: cada una entra en un IN (…) de SQLite, y la query string
    // admite repetir ?brand= sin límite.
    brands: many(sp.brand).slice(0, 20),
    minPrice: num(sp.minPrice),
    maxPrice: num(sp.maxPrice),
    onSale: one(sp.onSale) === "1",
    inStock: one(sp.inStock) === "1",
    sort: (one(sp.sort) as SortOption) || "relevance",
  };
}

/** Productos por página del catálogo. */
export const PAGE_SIZE = 24;

export interface ProductPage {
  items: Product[];
  /** Total de productos que matchean el filtro (no los de esta página). */
  total: number;
  page: number;
  pages: number;
}

/**
 * Orden traducido a `ORDER BY` de la base. Antes se traía el catálogo entero y
 * se ordenaba en memoria, así que la página crecía sin techo con el catálogo.
 * `best_discount` es el único que no se puede expresar en SQL con este esquema
 * (sale de price/previousPrice) y se resuelve aparte, más abajo.
 */
const ORDER_BY = {
  relevance: { salesRank: "desc" },
  best_selling: { salesRank: "desc" },
  // Por fecha de alta real, no por el tilde manual "Es novedad".
  newest: { createdAt: "desc" },
  price_asc: { price: "asc" },
  price_desc: { price: "desc" },
  top_rated: { rating: "desc" },
} as const;

function whereFor(q: CatalogQuery) {
  return {
    ...visible,
    ...(q.category ? { category: { slug: q.category } } : {}),
    ...(q.brands && q.brands.length ? { brand: { name: { in: q.brands } } } : {}),
    ...(q.minPrice !== undefined ? { price: { gte: q.minPrice } } : {}),
    ...(q.maxPrice !== undefined ? { price: { lte: q.maxPrice } } : {}),
    ...(q.onSale ? { previousPrice: { not: null } } : {}),
    ...(q.inStock ? { stockQty: { gt: 0 } } : {}),
  };
}

export async function queryProducts(q: CatalogQuery, page = 1): Promise<ProductPage> {
  const where = whereFor(q);
  const total = await prisma.product.count({ where });
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const current = Math.min(Math.max(1, Math.floor(page) || 1), pages);
  const skip = (current - 1) * PAGE_SIZE;

  if (q.sort === "best_discount") {
    // Se traen solo tres columnas para ordenar por descuento, se recorta la
    // página y recién ahí se piden las filas completas con sus relaciones.
    const light = await prisma.product.findMany({
      where,
      select: { id: true, price: true, previousPrice: true },
    });
    const pct = (r: { price: number; previousPrice: number | null }) =>
      r.previousPrice ? 1 - r.price / r.previousPrice : 0;
    light.sort((a, b) => pct(b) - pct(a));
    const ids = light.slice(skip, skip + PAGE_SIZE).map((r) => r.id);
    const rows = await prisma.product.findMany({ where: { id: { in: ids } }, include });
    const byId = new Map(rows.map((r) => [r.id, r]));
    const items = ids.map((id) => toProduct(byId.get(id) as DbProduct));
    return { items, total, page: current, pages };
  }

  const rows = await prisma.product.findMany({
    where,
    include,
    orderBy: ORDER_BY[q.sort ?? "relevance"] ?? ORDER_BY.relevance,
    skip,
    take: PAGE_SIZE,
  });
  return { items: rows.map(toProduct), total, page: current, pages };
}

export async function getFeatured(limit = 4): Promise<Product[]> {
  const rows = await prisma.product.findMany({
    where: { ...visible, isFeatured: true },
    include,
    orderBy: { salesRank: "desc" },
    take: limit,
  });
  return rows.map(toProduct);
}

export async function getBestSellers(limit = 4): Promise<Product[]> {
  const rows = await prisma.product.findMany({
    where: visible,
    include,
    orderBy: { salesRank: "desc" },
    take: limit,
  });
  return rows.map(toProduct);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const p = await prisma.product.findFirst({ where: { slug, ...visible }, include });
  return p ? toProduct(p as DbProduct) : null;
}

export async function getRelated(product: Product, limit = 4): Promise<Product[]> {
  const rows = await prisma.product.findMany({
    where: { ...visible, category: { slug: product.categorySlug }, id: { not: product.id } },
    include,
    take: limit,
  });
  return rows.map(toProduct);
}

// ─────────────── Búsqueda ───────────────

function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/**
 * Formas a buscar de una palabra, para que el plural encuentre el singular:
 * "candados" → candado, "alicates" → alicate, "destornilladores" → destornillador.
 * Al revés funciona solo: "candado" ya es subcadena de "candados".
 */
function forms(word: string): string[] {
  const out = [word];
  if (word.length > 4 && word.endsWith("es")) out.push(word.slice(0, -2));
  if (word.length > 4 && word.endsWith("s")) out.push(word.slice(0, -1));
  return out;
}

/**
 * Tope de filas que se traen para buscar. La búsqueda es tolerante a acentos y
 * a plurales, así que el filtrado tiene que pasar por JavaScript: SQLite no
 * puede hacerlo. Con este tope el costo deja de crecer con el catálogo.
 * El reemplazo de fondo (FTS o Meilisearch) ya está en docs/01-ARCHITECTURE.md.
 */
const SEARCH_SCAN_LIMIT = 2000;

/**
 * Tope de resultados que devuelve la página /buscar.
 *
 * El escaneo ya estaba acotado, pero lo que se DEVOLVÍA no: con un término muy
 * común la página renderizaba una tarjeta por cada coincidencia, hasta 2000, en
 * un HTML de varios megabytes. Repetir ese GET desde una sola conexión saturaba
 * la única instancia. Nadie mira dos mil resultados: quien no encuentra lo que
 * busca en los primeros afina el término.
 */
export const SEARCH_PAGE_MAX = 48;

export async function searchProducts(q: string, limit?: number): Promise<Product[]> {
  const term = normalize(q.trim());
  if (!term) return [];
  const words = term.split(/\s+/).filter(Boolean).map(forms);

  const rows = await prisma.product.findMany({
    where: visible,
    include,
    orderBy: { salesRank: "desc" },
    take: SEARCH_SCAN_LIMIT,
  });
  const scored = rows
    .map(toProduct)
    .map((p) => {
      const hay = normalize(
        [p.name, p.brand, p.sku, p.shortDescription, p.tags.join(" "), p.categoryName].join(" "),
      );
      // Cada palabra tiene que aparecer en alguna de sus formas (singular o plural).
      if (!words.every((fs) => fs.some((f) => hay.includes(f)))) return null;
      let score = p.salesRank / 100;
      const nameN = normalize(p.name);
      const brandN = normalize(p.brand);
      const skuN = normalize(p.sku);
      for (const fs of words) {
        if (fs.some((f) => nameN.includes(f))) score += 10;
        if (fs.some((f) => brandN.includes(f))) score += 5;
        if (fs.some((f) => skuN.includes(f))) score += 8;
      }
      return { p, score };
    })
    .filter((x): x is { p: Product; score: number } => x !== null)
    .sort((a, b) => b.score - a.score);

  const result = scored.map((x) => x.p);
  return limit ? result.slice(0, limit) : result;
}
