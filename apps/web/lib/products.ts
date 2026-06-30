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

export async function getCategories(): Promise<Category[]> {
  const cats = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { position: "asc" },
  });
  return cats.map((c) => ({ id: c.id, name: c.name, slug: c.slug, iconName: asIcon(c.iconName) }));
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const c = await prisma.category.findUnique({ where: { slug } });
  return c ? { id: c.id, name: c.name, slug: c.slug, iconName: asIcon(c.iconName) } : null;
}

export async function getBrandNames(categorySlug?: string): Promise<string[]> {
  const rows = await prisma.product.findMany({
    where: { ...visible, ...(categorySlug ? { category: { slug: categorySlug } } : {}) },
    include: { brand: true },
  });
  return Array.from(new Set(rows.map((r) => r.brand?.name).filter((b): b is string => !!b))).sort();
}

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
    brands: many(sp.brand),
    minPrice: num(sp.minPrice),
    maxPrice: num(sp.maxPrice),
    onSale: one(sp.onSale) === "1",
    inStock: one(sp.inStock) === "1",
    sort: (one(sp.sort) as SortOption) || "relevance",
  };
}

function discountPct(p: Product) {
  return p.previousPrice ? Math.round((1 - p.price / p.previousPrice) * 100) : 0;
}

export async function queryProducts(q: CatalogQuery): Promise<Product[]> {
  const rows = await prisma.product.findMany({
    where: {
      ...visible,
      ...(q.category ? { category: { slug: q.category } } : {}),
      ...(q.brands && q.brands.length ? { brand: { name: { in: q.brands } } } : {}),
      ...(q.minPrice !== undefined ? { price: { gte: q.minPrice } } : {}),
      ...(q.maxPrice !== undefined ? { price: { lte: q.maxPrice } } : {}),
      ...(q.onSale ? { previousPrice: { not: null } } : {}),
      ...(q.inStock ? { stockQty: { gt: 0 } } : {}),
    },
    include,
  });

  const list = rows.map(toProduct);

  switch (q.sort) {
    case "best_selling": list.sort((a, b) => b.salesRank - a.salesRank); break;
    case "newest": list.sort((a, b) => Number(b.isNew) - Number(a.isNew)); break;
    case "price_asc": list.sort((a, b) => a.price - b.price); break;
    case "price_desc": list.sort((a, b) => b.price - a.price); break;
    case "top_rated": list.sort((a, b) => b.rating - a.rating); break;
    case "best_discount": list.sort((a, b) => discountPct(b) - discountPct(a)); break;
    default: list.sort((a, b) => b.salesRank - a.salesRank); break;
  }
  return list;
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

export async function searchProducts(q: string, limit?: number): Promise<Product[]> {
  const term = normalize(q.trim());
  if (!term) return [];
  const words = term.split(/\s+/).filter(Boolean);

  const rows = await prisma.product.findMany({ where: visible, include });
  const scored = rows
    .map(toProduct)
    .map((p) => {
      const hay = normalize(
        [p.name, p.brand, p.sku, p.shortDescription, p.tags.join(" "), p.categoryName].join(" "),
      );
      if (!words.every((w) => hay.includes(w))) return null;
      let score = p.salesRank / 100;
      const nameN = normalize(p.name);
      const brandN = normalize(p.brand);
      for (const w of words) {
        if (nameN.includes(w)) score += 10;
        if (brandN.includes(w)) score += 5;
        if (normalize(p.sku).includes(w)) score += 8;
      }
      return { p, score };
    })
    .filter((x): x is { p: Product; score: number } => x !== null)
    .sort((a, b) => b.score - a.score);

  const result = scored.map((x) => x.p);
  return limit ? result.slice(0, limit) : result;
}
