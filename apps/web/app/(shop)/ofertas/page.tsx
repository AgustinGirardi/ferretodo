import type { Metadata } from "next";
import { BadgePercent } from "lucide-react";
import { Breadcrumbs } from "@/components/catalog/breadcrumbs";
import { CatalogFilters } from "@/components/catalog/catalog-filters";
import { MobileFilters } from "@/components/catalog/mobile-filters";
import { SortSelect } from "@/components/catalog/sort-select";
import { ProductGrid } from "@/components/catalog/product-grid";
import { Pagination, pageParam } from "@/components/ui/pagination";
import { parseQuery, queryProducts, getBrandNames, getCategories } from "@/lib/products";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ofertas",
  description:
    "Todos los productos en oferta de FERRETODO: herramientas, electricidad, plomería y construcción con precio rebajado.",
};

export default async function OffersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const base = parseQuery(sp);
  // La oferta no es un filtro más acá: es de qué se trata la página. Y si el
  // visitante no eligió orden, se muestran primero los descuentos más grandes.
  const query = { ...base, onSale: true, sort: sp.sort ? base.sort : ("best_discount" as const) };
  const [results, brands, categories] = await Promise.all([
    queryProducts(query, pageParam(sp.page)),
    getBrandNames(),
    getCategories(),
  ]);

  return (
    <div className="container mx-auto px-4 py-6">
      <Breadcrumbs items={[{ label: "Ofertas" }]} />

      <div className="mt-4 flex items-center gap-2.5">
        <BadgePercent className="h-7 w-7 text-sale" />
        <h1 className="text-2xl font-bold text-fg">Ofertas</h1>
      </div>
      <p className="mt-1 text-sm text-muted">
        Productos con precio rebajado. Stock real: lo que ves acá lo tenemos en el local.
      </p>

      <div className="mt-6 flex flex-col gap-6 lg:flex-row">
        <aside className="hidden lg:block lg:w-64 lg:shrink-0">
          <div className="rounded-lg border border-border bg-bg p-4 lg:sticky lg:top-20">
            <CatalogFilters brands={brands} categories={categories} showCategory showOnSale={false} />
          </div>
        </aside>

        <div className="flex-1">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-sm text-muted">
              {results.total} {results.total === 1 ? "producto en oferta" : "productos en oferta"}
            </p>
            <div className="flex items-center gap-2">
              <MobileFilters brands={brands} categories={categories} showCategory showOnSale={false} />
              <SortSelect />
            </div>
          </div>
          <ProductGrid products={results.items} />
          <Pagination page={results.page} pages={results.pages} basePath="/ofertas" params={sp} />
        </div>
      </div>
    </div>
  );
}
