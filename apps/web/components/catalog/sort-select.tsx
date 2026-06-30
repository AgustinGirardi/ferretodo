"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { sortOptions } from "@/lib/sort";

export function SortSelect() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("sort") ?? "relevance";

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    if (e.target.value === "relevance") params.delete("sort");
    else params.set("sort", e.target.value);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <label className="flex items-center gap-2 text-sm text-muted">
      <span className="hidden sm:inline">Ordenar por</span>
      <select
        value={current}
        onChange={onChange}
        className="rounded-md border border-border bg-bg px-3 py-2 text-sm text-fg outline-none focus:border-brand-500"
      >
        {sortOptions.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
