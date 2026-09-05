import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Params = Record<string, string | string[] | undefined>;

interface PaginationProps {
  page: number;
  pages: number;
  /** Ruta sobre la que se arman los links, ej. "/productos". */
  basePath: string;
  /** searchParams actuales: se conservan los filtros al cambiar de página. */
  params?: Params;
  /** Texto del total, ej. "1.251 pedidos". */
  summary?: string;
}

/** Ventana de hasta 5 números alrededor de la página actual. */
function window5(page: number, pages: number): number[] {
  const start = Math.max(1, Math.min(page - 2, pages - 4));
  const end = Math.min(pages, start + 4);
  const out: number[] = [];
  for (let i = start; i <= end; i++) out.push(i);
  return out;
}

export function Pagination({ page, pages, basePath, params = {}, summary }: PaginationProps) {
  if (pages <= 1) return null;

  const href = (p: number) => {
    const sp = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (key === "page" || value === undefined) continue;
      for (const one of Array.isArray(value) ? value : [value]) sp.append(key, one);
    }
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const box =
    "inline-flex h-9 min-w-9 items-center justify-center rounded-md border border-border px-3 text-sm transition-colors";

  return (
    <nav className="mt-8 flex flex-wrap items-center justify-center gap-2" aria-label="Paginación">
      {page > 1 ? (
        <Link href={href(page - 1)} className={`${box} text-fg hover:border-brand-500 hover:text-brand-600`} rel="prev">
          <ChevronLeft className="h-4 w-4" /> Anterior
        </Link>
      ) : (
        <span className={`${box} text-muted opacity-50`} aria-hidden="true">
          <ChevronLeft className="h-4 w-4" /> Anterior
        </span>
      )}

      {window5(page, pages).map((p) =>
        p === page ? (
          <span key={p} className={`${box} border-brand-cta bg-brand-cta font-medium text-white`} aria-current="page">
            {p}
          </span>
        ) : (
          <Link key={p} href={href(p)} className={`${box} text-fg hover:border-brand-500 hover:text-brand-600`}>
            {p}
          </Link>
        ),
      )}

      {page < pages ? (
        <Link href={href(page + 1)} className={`${box} text-fg hover:border-brand-500 hover:text-brand-600`} rel="next">
          Siguiente <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <span className={`${box} text-muted opacity-50`} aria-hidden="true">
          Siguiente <ChevronRight className="h-4 w-4" />
        </span>
      )}

      <span className="w-full text-center text-xs text-muted">
        Página {page} de {pages}
        {summary ? ` · ${summary}` : ""}
      </span>
    </nav>
  );
}

/** Lee ?page= de los searchParams (1 si falta o es inválido). */
export function pageParam(value: string | string[] | undefined): number {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}
