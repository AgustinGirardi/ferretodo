"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { iconMap, type IconName } from "@/lib/icons";

interface Suggestion {
  id: string;
  slug: string;
  name: string;
  brand: string;
  price: number;
  iconName: IconName;
}

export function SearchBar({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  // Sugerencia resaltada con las flechas. -1 = ninguna (manda lo que se escribió).
  const [active, setActive] = useState(-1);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const LISTBOX_ID = "buscador-sugerencias";
  const optionId = (i: number) => `${LISTBOX_ID}-${i}`;

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setSuggestions([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: ctrl.signal })
        .then((r) => r.json())
        .then((data: Suggestion[]) => {
          setSuggestions(data);
          setActive(-1);
        })
        .catch(() => {});
    }, 200);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query]);

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

  /**
   * Navegación con teclado del combobox. Antes las sugerencias solo se podían
   * tocar con el mouse: quien escribe y baja con la flecha no llegaba a ninguna.
   * El foco se queda en el input y la opción resaltada se anuncia con
   * aria-activedescendant, que es el patrón de combobox de ARIA.
   */
  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setOpen(false);
      setActive(-1);
      return;
    }
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === "Enter" && active >= 0) {
      // Con una sugerencia resaltada, Enter va a ese producto en vez de a la
      // página de resultados: es lo que el lector de pantalla acaba de anunciar.
      e.preventDefault();
      const picked = suggestions[active];
      if (picked) goTo(picked.slug);
    }
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
          onKeyDown={onKeyDown}
          placeholder="Buscar productos, marcas o códigos..."
          className="flex-1 bg-transparent px-4 py-2.5 text-sm text-fg outline-none placeholder:text-muted"
          aria-label="Buscar productos"
          autoComplete="off"
          role="combobox"
          aria-expanded={open && suggestions.length > 0}
          aria-controls={LISTBOX_ID}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? optionId(active) : undefined}
        />
        <button
          type="submit"
          className="flex shrink-0 items-center justify-center self-stretch px-4 text-white bg-brand-cta transition-colors hover:bg-brand-cta-hover"
          aria-label="Buscar"
        >
          <Search className="h-5 w-5 shrink-0" />
        </button>
      </form>

      {open && suggestions.length > 0 && (
        <div
          className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-border bg-bg shadow-lg"
          onMouseDown={() => blurTimer.current && clearTimeout(blurTimer.current)}
        >
          {/* Las opciones no son botones: en un listbox el foco se queda en el
              input y la opción activa se señala con aria-activedescendant. */}
          <ul id={LISTBOX_ID} role="listbox" aria-label="Sugerencias">
            {suggestions.map((p, i) => {
              const Icon = iconMap[p.iconName] ?? iconMap.bolt;
              return (
                <li
                  key={p.id}
                  id={optionId(i)}
                  role="option"
                  aria-selected={i === active}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => goTo(p.slug)}
                  className={`flex w-full cursor-pointer items-center gap-3 px-3 py-2 text-left ${
                    i === active ? "bg-surface" : ""
                  }`}
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
                </li>
              );
            })}
          </ul>
          {/* Fuera del listbox: no es una sugerencia sino la salida a la página
              de resultados. Con el teclado se llega con Enter sin resaltar nada. */}
          <button
            type="button"
            onClick={() => submit({ preventDefault() {} } as React.FormEvent)}
            className="w-full bg-surface px-3 py-2 text-center text-xs font-medium text-brand-600 hover:underline"
          >
            Ver todos los resultados para “{query.trim()}”
          </button>
        </div>
      )}
    </div>
  );
}
