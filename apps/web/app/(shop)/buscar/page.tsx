import type { Metadata } from "next";
import Link from "next/link";
import { SearchX } from "lucide-react";
import { Breadcrumbs } from "@/components/catalog/breadcrumbs";
import { ProductGrid } from "@/components/catalog/product-grid";
import { searchProducts, getBestSellers, SEARCH_PAGE_MAX } from "@/lib/products";
import { clientIp } from "@/lib/client-ip";
import { isRateLimited } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

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
  // Se recorta el término como ya hace /api/search: el largo no aporta nada a la
  // búsqueda y sí al costo de normalizar contra cada fila.
  const query = q.trim().slice(0, 100);

  // La route handler de /api/search estaba limitada, esta página no, y es la más
  // cara de las dos: escanea el catálogo y renderiza los resultados en el
  // servidor. Sin freno, un GET repetido bastaba para tumbar la instancia.
  const limited = query ? isRateLimited(`search-page:${await clientIp()}`, 30, 60_000) : false;

  // Se pide uno más que el tope para saber si hubo que recortar, sin contar todo.
  const found = limited || !query ? [] : await searchProducts(query, SEARCH_PAGE_MAX + 1);
  const truncated = found.length > SEARCH_PAGE_MAX;
  const results = truncated ? found.slice(0, SEARCH_PAGE_MAX) : found;
  const bestSellers = await getBestSellers(4);

  if (limited) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Breadcrumbs items={[{ label: "Búsqueda" }]} />
        <div className="mt-8 flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
          <SearchX className="h-10 w-10 text-muted" />
          <p className="text-sm font-medium text-fg">Demasiadas búsquedas seguidas</p>
          <p className="max-w-sm text-sm text-muted">
            Esperá unos segundos y volvé a intentarlo.
          </p>
        </div>
      </div>
    );
  }

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
          {truncated
            ? `Más de ${SEARCH_PAGE_MAX} resultados. Mostramos los primeros ${SEARCH_PAGE_MAX}: probá con más palabras para achicar la búsqueda.`
            : `${results.length} ${results.length === 1 ? "resultado" : "resultados"}`}
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
