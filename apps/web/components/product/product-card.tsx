import Link from "next/link";
import { Check, AlertTriangle, X, ShoppingCart } from "lucide-react";
import { Button } from "@ferretodo/ui";
import { formatPrice } from "@/lib/format";
import type { MockProduct } from "@/lib/catalog-data";

function StockBadge({ stock }: { stock: MockProduct["stock"] }) {
  if (stock === "in")
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
        <Check className="h-3.5 w-3.5" /> En stock
      </span>
    );
  if (stock === "low")
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-warning">
        <AlertTriangle className="h-3.5 w-3.5" /> Últimas unidades
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-danger">
      <X className="h-3.5 w-3.5" /> Sin stock
    </span>
  );
}

export function ProductCard({ product }: { product: MockProduct }) {
  const Icon = product.icon;
  const discount = product.previousPrice
    ? Math.round((1 - product.price / product.previousPrice) * 100)
    : 0;

  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border border-border bg-bg transition-shadow hover:shadow-md">
      <Link
        href={`/productos/${product.slug}`}
        className="relative flex aspect-square items-center justify-center bg-surface"
      >
        {discount > 0 && (
          <span className="absolute left-2 top-2 rounded-full bg-sale px-2 py-0.5 text-xs font-medium text-white">
            -{discount}%
          </span>
        )}
        <Icon className="h-16 w-16 text-muted/40" strokeWidth={1.25} />
      </Link>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <span className="text-xs text-muted">{product.brand}</span>
        <Link
          href={`/productos/${product.slug}`}
          className="line-clamp-2 min-h-[2.5rem] text-sm font-medium text-fg hover:text-brand-600"
        >
          {product.name}
        </Link>

        <div className="mt-auto">
          {product.previousPrice && (
            <span className="text-xs text-muted line-through">
              {formatPrice(product.previousPrice)}
            </span>
          )}
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-fg">{formatPrice(product.price)}</span>
          </div>
          <span className="text-xs font-medium text-success">12 cuotas sin interés</span>
        </div>

        <div className="mt-1">
          <StockBadge stock={product.stock} />
        </div>

        <Button
          variant="primary"
          size="sm"
          className="mt-2 w-full"
          disabled={product.stock === "out"}
        >
          <ShoppingCart className="h-4 w-4" /> Agregar
        </Button>
      </div>
    </article>
  );
}
