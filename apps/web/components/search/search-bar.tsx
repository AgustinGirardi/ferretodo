"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { searchProducts } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { iconMap } from "@/lib/icons";

export function SearchBar({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const suggestions = useMemo(
    () => (query.trim().length >= 2 ? searchProducts(query, 6) : []),
    [query],
  );

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setOpen(false);
    router.push(`/buscar?q=${encodeURIComponent(query.trim())}`);
  }

  function goTo(slug: string) {
    setOpen(false);
    setQuery("");
    router.push(`/productos/${slug}`);
  }

  return (
    <div className={`relative ${className}`}>
      <form
        onSubmit={submit}
        className="flex items-center overflow-hidden rounded-md border border-border focus-within:border-brand-500"
      >
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            blurTimer.current = setTimeout(() => setOpen(false), 150);
          }}
          onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
          placeholder="Buscar productos, marcas o códigos..."
          className="flex-1 bg-transparent px-4 py-2.5 text-sm text-fg outline-none placeholder:text-muted"
          aria-label="Buscar productos"
          autoComplete="off"
        />
        <button
          type="submit"
          className="flex h-full items-center bg-brand-500 px-4 text-white transition-colors hover:bg-brand-600"
          aria-label="Buscar"
        >
          <Search className="h-5 w-5" />
        </button>
      </form>

      {open && suggestions.length > 0 && (
        <ul
          className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-border bg-bg shadow-lg"
          onMouseDown={() => blurTimer.current && clearTimeout(blurTimer.current)}
        >
          {suggestions.map((p) => {
            const Icon = iconMap[p.iconName];
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => goTo(p.slug)}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-surface"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-surface">
                    <Icon className="h-5 w-5 text-muted/50" strokeWidth={1.5} />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm text-fg">{p.name}</span>
                    <span className="text-xs text-muted">{p.brand}</span>
                  </span>
                  <span className="shrink-0 text-sm font-medium text-fg">
                    {formatPrice(p.price)}
                  </span>
                </button>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => submit({ preventDefault() {} } as React.FormEvent)}
              className="w-full bg-surface px-3 py-2 text-center text-xs font-medium text-brand-600 hover:underline"
            >
              Ver todos los resultados para “{query.trim()}”
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
