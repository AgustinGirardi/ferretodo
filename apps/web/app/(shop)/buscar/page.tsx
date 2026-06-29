import type { Metadata } from "next";
import Link from "next/link";
import { SearchX } from "lucide-react";
import { Breadcrumbs } from "@/components/catalog/breadcrumbs";
import { ProductGrid } from "@/components/catalog/product-grid";
import { searchProducts } from "@/lib/catalog";
import { bestSellers } from "@/lib/catalog-data";

export const metadata: Metadata = {
  title: "Búsqueda",
  robots: { index: false },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  const results = query ? searchProducts(query) : [];

  return (
    <div className="container mx-auto px-4 py-6">
      <Breadcrumbs items={[{ label: "Búsqueda" }]} />

      <h1 className="mt-4 text-2xl font-bold text-fg">
        {query ? (
          <>
            Resultados para <span className="text-brand-600">“{query}”</span>
          </>
        ) : (
          "¿Qué estás buscando?"
        )}
      </h1>

      {query && (
        <p className="mt-1 text-sm text-muted">
          {results.length} {results.length === 1 ? "resultado" : "resultados"}
        </p>
      )}

      <div className="mt-6">
        {query && results.length > 0 ? (
          <ProductGrid products={results} />
        ) : query ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
            <SearchX className="h-10 w-10 text-muted" />
            <p className="text-sm font-medium text-fg">
              No encontramos nada para “{query}”
            </p>
            <p className="max-w-sm text-sm text-muted">
              Probá con otras palabras (por ejemplo el tipo de producto o la marca) o mirá lo más
              vendido.
            </p>
            <Link
              href="/productos"
              className="mt-1 text-sm font-medium text-brand-600 hover:text-brand-500"
            >
              Ver todo el catálogo
            </Link>
          </div>
        ) : null}
      </div>

      {(!query || results.length === 0) && (
        <section className="mt-12">
          <h2 className="mb-5 text-xl font-bold text-fg">Lo más vendido</h2>
          <ProductGrid products={bestSellers} />
        </section>
      )}
    </div>
  );
}
