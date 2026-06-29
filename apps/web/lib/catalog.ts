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

export function getProductBySlug(slug: string) {
  return products.find((p) => p.slug === slug);
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
