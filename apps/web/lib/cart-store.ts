"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { IconName } from "./icons";

/** Datos del producto que el carrito guarda al agregarlo (snapshot). */
export interface CartItemInput {
  id: string;
  slug: string;
  name: string;
  brand: string;
  price: number;
  iconName: IconName;
  imageUrl?: string;
  /** Stock al momento de agregarlo: topea el "+" del carrito. Puede faltar en
   *  carritos guardados antes de este campo, y ahí no se topea nada. */
  maxQty?: number;
}

export interface CartItem extends CartItemInput {
  qty: number;
}

interface CartState {
  items: CartItem[];
  add: (item: CartItemInput, qty?: number) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
}

/**
 * Carrito persistido en localStorage. Guarda un snapshot de cada producto, así
 * el carrito funciona sin importar de dónde vengan los datos (mock o base de
 * datos). En el futuro se sincroniza con el backend.
 */
export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add: (item, qty = 1) =>
        set((s) => {
          const cap = item.maxQty && item.maxQty > 0 ? item.maxQty : 999;
          const existing = s.items.find((i) => i.id === item.id);
          if (existing) {
            // Se refresca el snapshot: si cambió el stock, vale el nuevo.
            return {
              items: s.items.map((i) =>
                i.id === item.id ? { ...i, ...item, qty: Math.min(cap, i.qty + qty) } : i,
              ),
            };
          }
          return { items: [...s.items, { ...item, qty: Math.min(cap, qty) }] };
        }),
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      setQty: (id, qty) =>
        set((s) => ({
          items:
            qty <= 0
              ? s.items.filter((i) => i.id !== id)
              : s.items.map((i) =>
                  i.id === id ? { ...i, qty: Math.min(i.maxQty && i.maxQty > 0 ? i.maxQty : 999, qty) } : i,
                ),
        })),
      clear: () => set({ items: [] }),
    }),
    { name: "ferretodo-cart" },
  ),
);

export const cartCount = (items: CartItem[]) => items.reduce((n, i) => n + i.qty, 0);
