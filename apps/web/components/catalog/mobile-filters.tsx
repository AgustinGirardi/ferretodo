"use client";

import { useEffect, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { CatalogFilters } from "./catalog-filters";

interface MobileFiltersProps {
  brands: string[];
  categories: { name: string; slug: string }[];
  showCategory?: boolean;
}

/** Botón "Filtros" para mobile: abre los filtros del catálogo en un drawer. */
export function MobileFilters({ brands, categories, showCategory = true }: MobileFiltersProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm text-fg transition-colors hover:bg-surface lg:hidden"
      >
        <SlidersHorizontal className="h-4 w-4" /> Filtros
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-black/50"
            aria-label="Cerrar filtros"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 right-0 flex w-80 max-w-[85vw] flex-col bg-bg shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <span className="font-medium text-fg">Filtros</span>
              <button aria-label="Cerrar filtros" onClick={() => setOpen(false)}>
                <X className="h-5 w-5 text-fg" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <CatalogFilters brands={brands} categories={categories} showCategory={showCategory} />
            </div>

            <div className="border-t border-border p-4">
              <button
                onClick={() => setOpen(false)}
                className="w-full rounded-md bg-brand-500 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-600"
              >
                Ver resultados
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
