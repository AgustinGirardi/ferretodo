"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingCart, MessageCircle, ArrowRight, FileText } from "lucide-react";
import { Button } from "@ferretodo/ui";
import { CartItemRow } from "@/components/cart/cart-item-row";
import { ProductCard } from "@/components/product/product-card";
import { useCart } from "@/lib/cart-store";
import { cartSubtotal, cartWhatsappMessage } from "@/lib/cart-utils";
import { formatPrice } from "@/lib/format";
import { site, whatsappLink } from "@/lib/site";
import type { Product } from "@/lib/products";

export function CartView({ suggestions }: { suggestions: Product[] }) {
  const items = useCart((s) => s.items);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="container mx-auto px-4 py-16 text-center text-muted">Cargando…</div>;
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto flex flex-col items-center gap-4 px-4 py-20 text-center">
        <ShoppingCart className="h-12 w-12 text-muted" />
        <h1 className="text-xl font-bold text-fg">Tu carrito está vacío</h1>
        <p className="max-w-sm text-sm text-muted">
          Agregá productos y aparecerán acá.
        </p>
        <Link href="/productos">
          <Button variant="primary" size="lg">
            Ver productos
          </Button>
        </Link>
      </div>
    );
  }

  const subtotal = cartSubtotal(items);
  const filteredSuggestions = suggestions.filter((p) => !items.some((i) => i.id === p.id)).slice(0, 4);

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-fg">Tu carrito</h1>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div>
          {items.map((i) => (
            <CartItemRow key={i.id} item={i} />
          ))}
          <Link
            href="/productos"
            className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-500"
          >
            ← Seguir comprando
          </Link>
        </div>

        <aside className="h-fit rounded-xl border border-border bg-bg p-5 lg:sticky lg:top-20">
          <h2 className="text-lg font-bold text-fg">Resumen</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd className="font-medium text-fg">{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Envío</dt>
              <dd className="text-muted">A calcular en el checkout</dd>
            </div>
          </dl>
          <div className="mt-4 flex justify-between border-t border-border pt-4">
            <span className="font-bold text-fg">Total</span>
            <span className="text-xl font-bold text-fg">{formatPrice(subtotal)}</span>
          </div>

          <Link href="/checkout" className="mt-5 block">
            <Button variant="primary" size="lg" className="w-full">
              Iniciar compra <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>

          <a
            href={whatsappLink(cartWhatsappMessage(items))}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 block"
          >
            <Button variant="whatsapp" size="lg" className="w-full">
              <MessageCircle className="h-5 w-5" /> Pedir presupuesto
            </Button>
          </a>

          <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted">
            <FileText className="h-3.5 w-3.5" /> {site.installments.label} disponibles
          </p>
        </aside>
      </div>

      {filteredSuggestions.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-5 text-xl font-bold text-fg">También te puede interesar</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {filteredSuggestions.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
