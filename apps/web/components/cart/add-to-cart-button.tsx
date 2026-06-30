"use client";

import { useState } from "react";
import { ShoppingCart, Check } from "lucide-react";
import { Button } from "@ferretodo/ui";
import { useCart, type CartItemInput } from "@/lib/cart-store";

interface AddToCartButtonProps {
  item: CartItemInput;
  outOfStock?: boolean;
}

export function AddToCartButton({ item, outOfStock }: AddToCartButtonProps) {
  const add = useCart((s) => s.add);
  const [added, setAdded] = useState(false);

  function onAdd() {
    add(item);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  return (
    <Button variant="primary" size="sm" className="mt-2 w-full" disabled={outOfStock} onClick={onAdd}>
      {added ? (
        <>
          <Check className="h-4 w-4" /> Agregado
        </>
      ) : (
        <>
          <ShoppingCart className="h-4 w-4" /> Agregar
        </>
      )}
    </Button>
  );
}
