"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartLine {
  id: string; // productId
  qty: number;
}

interface CartState {
  items: CartLine[];
  add: (id: string, qty?: number) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
}

/**
 * Carrito persistido en localStorage. Mientras no haya backend, es la fuente de
 * verdad del carrito. En Fase 1 se sincroniza con el módulo cart de la API
 * (merge anónimo → logueado). Ver docs/04-FRONTEND.md.
 */
export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add: (id, qty = 1) =>
        set((s) => {
          const existing = s.items.find((i) => i.id === id);
          if (existing) {
            return { items: s.items.map((i) => (i.id === id ? { ...i, qty: i.qty + qty } : i)) };
          }
          return { items: [...s.items, { id, qty }] };
        }),
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      setQty: (id, qty) =>
        set((s) => ({
          items:
            qty <= 0
              ? s.items.filter((i) => i.id !== id)
              : s.items.map((i) => (i.id === id ? { ...i, qty } : i)),
        })),
      clear: () => set({ items: [] }),
    }),
    { name: "ferretodo-cart" },
  ),
);

/** Total de unidades en el carrito. */
export const cartCount = (items: CartLine[]) => items.reduce((n, i) => n + i.qty, 0);
