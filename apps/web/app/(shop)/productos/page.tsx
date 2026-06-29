import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/catalog/breadcrumbs";
import { CatalogFilters } from "@/components/catalog/catalog-filters";
import { SortSelect } from "@/components/catalog/sort-select";
import { ProductGrid } from "@/components/catalog/product-grid";
import { parseQuery, queryProducts, getBrands } from "@/lib/catalog";
import { products } from "@/lib/catalog-data";

export const metadata: Metadata = {
  title: "Productos",
  description: "Explorá todo el catálogo de FERRETODO: herramientas, electricidad, plomería, pinturería y construcción.",
};

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const query = parseQuery(sp);
  const results = queryProducts(query);
  const brands = getBrands(products);

  return (
    <div className="container mx-auto px-4 py-6">
      <Breadcrumbs items={[{ label: "Productos" }]} />

      <h1 className="mt-4 text-2xl font-bold text-fg">Productos</h1>

      <div className="mt-6 flex flex-col gap-6 lg:flex-row">
        <aside className="lg:w-64 lg:shrink-0">
          <div className="rounded-lg border border-border bg-bg p-4 lg:sticky lg:top-40">
            <CatalogFilters brands={brands} showCategory />
          </div>
        </aside>

        <div className="flex-1">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-sm text-muted">
              {results.length} {results.length === 1 ? "producto" : "productos"}
            </p>
            <SortSelect />
          </div>
          <ProductGrid products={results} />
        </div>
      </div>
    </div>
  );
}
