import { products, categories, type MockProduct } from "./catalog-data";

export type SortOption =
  | "relevance"
  | "best_selling"
  | "newest"
  | "price_asc"
  | "price_desc"
  | "top_rated"
  | "best_discount";

export const sortOptions: { value: SortOption; label: string }[] = [
  { value: "relevance", label: "Más relevantes" },
  { value: "best_selling", label: "Más vendidos" },
  { value: "newest", label: "Más nuevos" },
  { value: "price_asc", label: "Menor precio" },
  { value: "price_desc", label: "Mayor precio" },
  { value: "top_rated", label: "Mejor calificados" },
  { value: "best_discount", label: "Mayor descuento" },
];

export interface CatalogQuery {
  category?: string;
  brands?: string[];
  minPrice?: number;
  maxPrice?: number;
  onSale?: boolean;
  inStock?: boolean;
  sort?: SortOption;
}

function discountPct(p: MockProduct): number {
  return p.previousPrice ? Math.round((1 - p.price / p.previousPrice) * 100) : 0;
}

/** Normaliza los searchParams de Next a una consulta tipada. */
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

export function getCategory(slug: string) {
  return categories.find((c) => c.slug === slug);
}

/** Quita acentos y pasa a minúsculas para comparar sin importar tildes/mayúsculas. */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/**
 * Búsqueda sobre nombre, marca, código, descripción, etiquetas y categoría.
 * Tolerante a acentos y mayúsculas. Requiere que todas las palabras coincidan
 * (AND) y rankea por dónde matchea (nombre > marca) y ventas.
 */
export function searchProducts(q: string, limit?: number): MockProduct[] {
  const term = normalize(q.trim());
  if (!term) return [];
  const words = term.split(/\s+/).filter(Boolean);

  const scored = products
    .map((p) => {
      const categoryName = getCategory(p.categorySlug)?.name ?? "";
      const haystack = normalize(
        [p.name, p.brand, p.sku, p.shortDescription, p.tags.join(" "), categoryName].join(" "),
      );
      if (!words.every((w) => haystack.includes(w))) return null;

      let score = (p.salesRank ?? 0) / 100;
      const nameN = normalize(p.name);
      const brandN = normalize(p.brand);
      for (const w of words) {
        if (nameN.includes(w)) score += 10;
        if (brandN.includes(w)) score += 5;
        if (normalize(p.sku).includes(w)) score += 8;
      }
      return { p, score };
    })
    .filter((x): x is { p: MockProduct; score: number } => x !== null)
    .sort((a, b) => b.score - a.score);

  const result = scored.map((x) => x.p);
  return limit ? result.slice(0, limit) : result;
}

export function getProductBySlug(slug: string) {
  return products.find((p) => p.slug === slug);
}

export function getProductById(id: string) {
  return products.find((p) => p.id === id);
}

export function getRelatedProducts(product: MockProduct, limit = 4) {
  return products
    .filter((p) => p.categorySlug === product.categorySlug && p.id !== product.id)
    .slice(0, limit);
}

/** Marcas disponibles dentro de un conjunto de productos (para los filtros). */
export function getBrands(list: MockProduct[]): string[] {
  return Array.from(new Set(list.map((p) => p.brand))).sort();
}

export function queryProducts(q: CatalogQuery): MockProduct[] {
  let list = [...products];

  if (q.category) list = list.filter((p) => p.categorySlug === q.category);
  if (q.brands && q.brands.length) list = list.filter((p) => q.brands!.includes(p.brand));
  if (q.minPrice !== undefined) list = list.filter((p) => p.price >= q.minPrice!);
  if (q.maxPrice !== undefined) list = list.filter((p) => p.price <= q.maxPrice!);
  if (q.onSale) list = list.filter((p) => discountPct(p) > 0);
  if (q.inStock) list = list.filter((p) => p.stock !== "out");

  switch (q.sort) {
    case "best_selling":
      list.sort((a, b) => (b.salesRank ?? 0) - (a.salesRank ?? 0));
      break;
    case "newest":
      list.sort((a, b) => Number(b.isNew ?? false) - Number(a.isNew ?? false));
      break;
    case "price_asc":
      list.sort((a, b) => a.price - b.price);
      break;
    case "price_desc":
      list.sort((a, b) => b.price - a.price);
      break;
    case "top_rated":
      list.sort((a, b) => b.rating - a.rating);
      break;
    case "best_discount":
      list.sort((a, b) => discountPct(b) - discountPct(a));
      break;
    default:
      break;
  }

  return list;
}
