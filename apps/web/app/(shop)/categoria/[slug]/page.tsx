import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/catalog/breadcrumbs";
import { CatalogFilters } from "@/components/catalog/catalog-filters";
import { MobileFilters } from "@/components/catalog/mobile-filters";
import { SortSelect } from "@/components/catalog/sort-select";
import { ProductGrid } from "@/components/catalog/product-grid";
import { Pagination, pageParam } from "@/components/ui/pagination";
import {
  parseQuery,
  queryProducts,
  getBrandNames,
  getCategoryBySlug,
  getCategories,
} from "@/lib/products";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Categoría" };
  return {
    title: category.name,
    description: `Comprá ${category.name.toLowerCase()} en FERRETODO. Stock real, envíos en Río Cuarto y cuotas.`,
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const sp = await searchParams;
  const query = { ...parseQuery(sp), category: slug };
  const [results, brands, categories] = await Promise.all([
    queryProducts(query, pageParam(sp.page)),
    getBrandNames(slug),
    getCategories(),
  ]);

  return (
    <div className="container mx-auto px-4 py-6">
      <Breadcrumbs items={[{ label: "Productos", href: "/productos" }, { label: category.name }]} />

      <h1 className="mt-4 text-2xl font-bold text-fg">{category.name}</h1>

      <div className="mt-6 flex flex-col gap-6 lg:flex-row">
        <aside className="hidden lg:block lg:w-64 lg:shrink-0">
          <div className="rounded-lg border border-border bg-bg p-4 lg:sticky lg:top-20">
            <CatalogFilters brands={brands} categories={categories} showCategory={false} />
          </div>
        </aside>

        <div className="flex-1">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-sm text-muted">
              {results.total} {results.total === 1 ? "producto" : "productos"}
            </p>
            <div className="flex items-center gap-2">
              <MobileFilters brands={brands} categories={categories} showCategory={false} />
              <SortSelect />
            </div>
          </div>
          <ProductGrid products={results.items} />
          <Pagination
            page={results.page}
            pages={results.pages}
            basePath={`/categoria/${slug}`}
            params={sp}
          />
        </div>
      </div>
    </div>
  );
}
