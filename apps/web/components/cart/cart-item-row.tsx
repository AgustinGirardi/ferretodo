"use client";

import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { getProductById } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { iconMap } from "@/lib/icons";

export function CartItemRow({ productId, qty }: { productId: string; qty: number }) {
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const product = getProductById(productId);
  if (!product) return null;

  const Icon = iconMap[product.iconName];

  return (
    <div className="flex gap-3 border-b border-border py-4">
      <Link
        href={`/productos/${product.slug}`}
        className="flex h-20 w-20 shrink-0 items-center justify-center rounded-md border border-border bg-surface"
      >
        <Icon className="h-9 w-9 text-muted/40" strokeWidth={1.25} />
      </Link>

      <div className="flex flex-1 flex-col">
        <span className="text-xs text-muted">{product.brand}</span>
        <Link
          href={`/productos/${product.slug}`}
          className="text-sm font-medium text-fg hover:text-brand-600"
        >
          {product.name}
        </Link>
        <span className="mt-0.5 text-xs text-muted">{formatPrice(product.price)} c/u</span>

        <div className="mt-auto flex items-center gap-3 pt-2">
          <div className="flex items-center rounded-md border border-border">
            <button
              onClick={() => setQty(productId, qty - 1)}
              className="flex h-8 w-8 items-center justify-center text-fg hover:bg-surface"
              aria-label="Restar"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-8 text-center text-sm font-medium">{qty}</span>
            <button
              onClick={() => setQty(productId, qty + 1)}
              className="flex h-8 w-8 items-center justify-center text-fg hover:bg-surface"
              aria-label="Sumar"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <button
            onClick={() => remove(productId)}
            className="inline-flex items-center gap-1 text-xs text-muted hover:text-danger"
          >
            <Trash2 className="h-3.5 w-3.5" /> Quitar
          </button>
        </div>
      </div>

      <div className="text-right">
        <span className="text-sm font-bold text-fg">{formatPrice(product.price * qty)}</span>
      </div>
    </div>
  );
}
