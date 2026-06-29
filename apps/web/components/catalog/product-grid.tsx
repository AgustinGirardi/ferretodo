import { PackageSearch } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import type { MockProduct } from "@/lib/catalog-data";

export function ProductGrid({ products }: { products: MockProduct[] }) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
        <PackageSearch className="h-10 w-10 text-muted" />
        <p className="text-sm font-medium text-fg">No encontramos productos</p>
        <p className="max-w-xs text-sm text-muted">
          Probá quitar algún filtro o buscar con otras palabras.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
