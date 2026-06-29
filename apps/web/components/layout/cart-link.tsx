"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart, cartCount } from "@/lib/cart-store";

export function CartLink() {
  const items = useCart((s) => s.items);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const count = mounted ? cartCount(items) : 0;

  return (
    <Link
      href="/carrito"
      className="relative inline-flex items-center gap-1.5 text-sm text-fg hover:text-brand-600"
    >
      <span className="relative">
        <ShoppingCart className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-medium text-white">
            {count}
          </span>
        )}
      </span>
      <span className="hidden md:inline">Carrito</span>
    </Link>
  );
}
