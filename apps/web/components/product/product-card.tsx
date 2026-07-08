import Link from "next/link";
import Image from "next/image";
import { Check, AlertTriangle, X } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { iconMap } from "@/lib/icons";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import type { Product, StockStatus } from "@/lib/products";

function StockBadge({ stock }: { stock: StockStatus }) {
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

export function ProductCard({ product }: { product: Product }) {
  const Icon = iconMap[product.iconName];
  const discount = product.previousPrice
    ? Math.round((1 - product.price / product.previousPrice) * 100)
    : 0;

  return (
    <article className="group flex w-full flex-col overflow-hidden rounded-lg border border-border bg-bg transition-all duration-300 hover:border-brand-500 hover:shadow-lg motion-safe:hover:-translate-y-1">
      <Link
        href={`/productos/${product.slug}`}
        className="relative flex aspect-square items-center justify-center overflow-hidden bg-surface"
      >
        {discount > 0 && (
          <span className="absolute left-2 top-2 z-10 rounded-full bg-sale px-2 py-0.5 text-xs font-medium text-white">
            -{discount}%
          </span>
        )}
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 motion-safe:group-hover:scale-105"
          />
        ) : (
          <Icon
            className="h-16 w-16 text-muted/40 transition-transform duration-300 motion-safe:group-hover:scale-110"
            strokeWidth={1.25}
          />
        )}
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

        <AddToCartButton
          item={{
            id: product.id,
            slug: product.slug,
            name: product.name,
            brand: product.brand,
            price: product.price,
            iconName: product.iconName,
            imageUrl: product.imageUrl,
          }}
          outOfStock={product.stock === "out"}
        />
      </div>
    </article>
  );
}
