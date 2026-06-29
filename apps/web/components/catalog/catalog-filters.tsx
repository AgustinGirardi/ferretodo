"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { categories } from "@/lib/catalog-data";

interface CatalogFiltersProps {
  brands: string[];
  showCategory?: boolean;
}

export function CatalogFilters({ brands, showCategory = true }: CatalogFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedBrands = searchParams.getAll("brand");
  const currentCategory = searchParams.get("category") ?? "";
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") ?? "");

  function commit(params: URLSearchParams) {
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === null || value === "") params.delete(key);
    else params.set(key, value);
    commit(params);
  }

  function toggleBrand(brand: string) {
    const params = new URLSearchParams(searchParams.toString());
    const current = params.getAll("brand");
    params.delete("brand");
    const next = current.includes(brand)
      ? current.filter((b) => b !== brand)
      : [...current, brand];
    next.forEach((b) => params.append("brand", b));
    commit(params);
  }

  function applyPrice() {
    const params = new URLSearchParams(searchParams.toString());
    if (minPrice) params.set("minPrice", minPrice);
    else params.delete("minPrice");
    if (maxPrice) params.set("maxPrice", maxPrice);
    else params.delete("maxPrice");
    commit(params);
  }

  function clearAll() {
    setMinPrice("");
    setMaxPrice("");
    router.replace(pathname, { scroll: false });
  }

  const hasFilters = searchParams.toString().length > 0;

  return (
    <div className="flex flex-col gap-6 text-sm">
      <div className="flex items-center justify-between">
        <span className="font-medium text-fg">Filtros</span>
        {hasFilters && (
          <button onClick={clearAll} className="text-xs text-brand-600 hover:text-brand-500">
            Limpiar
          </button>
        )}
      </div>

      {showCategory && (
        <fieldset>
          <legend className="mb-2 font-medium text-fg">Categoría</legend>
          <div className="flex flex-col gap-1.5">
            <button
              onClick={() => setParam("category", null)}
              className={`text-left ${currentCategory === "" ? "font-medium text-brand-600" : "text-muted hover:text-fg"}`}
            >
              Todas
            </button>
            {categories.map((c) => (
              <button
                key={c.slug}
                onClick={() => setParam("category", c.slug)}
                className={`text-left ${currentCategory === c.slug ? "font-medium text-brand-600" : "text-muted hover:text-fg"}`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <fieldset>
        <legend className="mb-2 font-medium text-fg">Marca</legend>
        <div className="flex max-h-48 flex-col gap-2 overflow-y-auto">
          {brands.map((brand) => (
            <label key={brand} className="flex cursor-pointer items-center gap-2 text-muted">
              <input
                type="checkbox"
                checked={selectedBrands.includes(brand)}
                onChange={() => toggleBrand(brand)}
                className="h-4 w-4 accent-brand-500"
              />
              {brand}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 font-medium text-fg">Precio</legend>
        <div className="flex items-center gap-2">
          <input
            type="number"
            inputMode="numeric"
            placeholder="Mín"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="w-full rounded-md border border-border bg-bg px-2 py-1.5 outline-none focus:border-brand-500"
          />
          <span className="text-muted">–</span>
          <input
            type="number"
            inputMode="numeric"
            placeholder="Máx"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-full rounded-md border border-border bg-bg px-2 py-1.5 outline-none focus:border-brand-500"
          />
        </div>
        <button
          onClick={applyPrice}
          className="mt-2 w-full rounded-md border border-border py-1.5 text-fg transition-colors hover:bg-surface"
        >
          Aplicar
        </button>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 font-medium text-fg">Más opciones</legend>
        <label className="flex cursor-pointer items-center gap-2 text-muted">
          <input
            type="checkbox"
            checked={searchParams.get("onSale") === "1"}
            onChange={(e) => setParam("onSale", e.target.checked ? "1" : null)}
            className="h-4 w-4 accent-brand-500"
          />
          En oferta
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-muted">
          <input
            type="checkbox"
            checked={searchParams.get("inStock") === "1"}
            onChange={(e) => setParam("inStock", e.target.checked ? "1" : null)}
            className="h-4 w-4 accent-brand-500"
          />
          Solo con stock
        </label>
      </fieldset>
    </div>
  );
}
