"use client";

import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart, type CartItem } from "@/lib/cart-store";
import { formatPrice } from "@/lib/format";
import { iconMap } from "@/lib/icons";

export function CartItemRow({ item }: { item: CartItem }) {
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const Icon = iconMap[item.iconName] ?? iconMap.bolt;

  return (
    <div className="flex gap-3 border-b border-border py-4">
      <Link
        href={`/productos/${item.slug}`}
        className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-surface"
      >
        {item.imageUrl ? (
          <Image src={item.imageUrl} alt={item.name} fill sizes="80px" className="object-cover" />
        ) : (
          <Icon className="h-9 w-9 text-muted/40" strokeWidth={1.25} />
        )}
      </Link>

      <div className="flex flex-1 flex-col">
        <span className="text-xs text-muted">{item.brand}</span>
        <Link
          href={`/productos/${item.slug}`}
          className="text-sm font-medium text-fg hover:text-brand-600"
        >
          {item.name}
        </Link>
        <span className="mt-0.5 text-xs text-muted">{formatPrice(item.price)} c/u</span>

        <div className="mt-auto flex items-center gap-3 pt-2">
          <div className="flex items-center rounded-md border border-border">
            <button
              onClick={() => setQty(item.id, item.qty - 1)}
              className="flex h-8 w-8 items-center justify-center text-fg hover:bg-surface"
              aria-label="Restar"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-8 text-center text-sm font-medium">{item.qty}</span>
            <button
              onClick={() => setQty(item.id, item.qty + 1)}
              className="flex h-8 w-8 items-center justify-center text-fg hover:bg-surface"
              aria-label="Sumar"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <button
            onClick={() => remove(item.id)}
            className="inline-flex items-center gap-1 text-xs text-muted hover:text-danger"
          >
            <Trash2 className="h-3.5 w-3.5" /> Quitar
          </button>
        </div>
      </div>

      <div className="text-right">
        <span className="text-sm font-bold text-fg">{formatPrice(item.price * item.qty)}</span>
      </div>
    </div>
  );
}
