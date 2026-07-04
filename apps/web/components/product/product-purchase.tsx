"use client";

import { useState } from "react";
import { Minus, Plus, ShoppingCart, Check, Heart } from "lucide-react";
import { Button } from "@ferretodo/ui";
import { useCart, type CartItemInput } from "@/lib/cart-store";

interface ProductPurchaseProps {
  item: CartItemInput;
  outOfStock?: boolean;
  /** Stock disponible: tope del selector de cantidad. */
  maxQty?: number;
}

/**
 * Selector de cantidad + acciones de compra. Conectado al carrito local
 * (Zustand), que guarda un snapshot del producto.
 */
export function ProductPurchase({ item, outOfStock = false, maxQty }: ProductPurchaseProps) {
  const limit = maxQty && maxQty > 0 ? Math.min(maxQty, 999) : 999;
  const add = useCart((s) => s.add);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [fav, setFav] = useState(false);

  function addToCart() {
    add(item, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  if (outOfStock) {
    return (
      <Button variant="secondary" size="lg" className="w-full" disabled>
        Sin stock por el momento
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted">Cantidad</span>
        <div className="flex items-center rounded-md border border-border">
          <button
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="flex h-10 w-10 items-center justify-center text-fg hover:bg-surface"
            aria-label="Restar"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-10 text-center text-sm font-medium">{qty}</span>
          <button
            onClick={() => setQty((q) => Math.min(limit, q + 1))}
            className="flex h-10 w-10 items-center justify-center text-fg hover:bg-surface disabled:opacity-40"
            aria-label="Sumar"
            disabled={qty >= limit}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        {qty >= limit && limit < 999 && (
          <span className="text-xs text-muted">Máximo disponible</span>
        )}
      </div>

      <Button variant="primary" size="lg" className="w-full" onClick={addToCart}>
        {added ? (
          <>
            <Check className="h-5 w-5" /> Agregado al carrito
          </>
        ) : (
          <>
            <ShoppingCart className="h-5 w-5" /> Agregar al carrito
          </>
        )}
      </Button>

      <Button variant="outline" size="lg" className="w-full">
        Comprar ahora
      </Button>

      <button
        onClick={() => setFav((f) => !f)}
        className="inline-flex items-center justify-center gap-2 text-sm text-muted hover:text-brand-600"
      >
        <Heart className={`h-4 w-4 ${fav ? "fill-brand-500 text-brand-500" : ""}`} />
        {fav ? "Guardado en favoritos" : "Agregar a favoritos"}
      </button>
    </div>
  );
}
