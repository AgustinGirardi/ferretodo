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
