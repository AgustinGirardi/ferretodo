"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Phone, HelpCircle } from "lucide-react";
import { site, whatsappLink } from "@/lib/site";
import { iconMap, type IconName } from "@/lib/icons";
import { SearchBar } from "@/components/search/search-bar";
import { LogoMark } from "./logo-mark";
import { ThemeToggle } from "./theme-toggle";

export interface MobileMenuCategory {
  name: string;
  slug: string;
  iconName: IconName;
}

export function MobileMenu({ categories }: { categories: MobileMenuCategory[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Cierra el drawer al navegar (links, búsqueda, etc.).
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Bloquea el scroll del fondo mientras está abierto.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button className="lg:hidden" aria-label="Abrir menú" onClick={() => setOpen(true)}>
        <Menu className="h-6 w-6 text-fg" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-black/50"
            aria-label="Cerrar menú"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-80 max-w-[85vw] flex-col bg-bg shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <span className="flex items-center gap-2 text-lg font-bold tracking-tight text-fg">
                <LogoMark className="h-6 w-6" />
                <span>
                  FERRE<span className="text-brand-500">TODO</span>
                </span>
              </span>
              <div className="flex items-center gap-1">
                <ThemeToggle />
                <button aria-label="Cerrar menú" onClick={() => setOpen(false)}>
                  <X className="h-5 w-5 text-fg" />
                </button>
              </div>
            </div>

            <div className="border-b border-border p-3 sm:hidden">
              <SearchBar />
            </div>

            <nav className="flex-1 overflow-y-auto p-3">
              <p className="px-3 pb-1 text-xs font-medium uppercase text-muted">Categorías</p>
              {categories.map((cat) => {
                const Icon = iconMap[cat.iconName];
                return (
                  <Link
                    key={cat.slug}
                    href={`/categoria/${cat.slug}`}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-fg hover:bg-surface"
                  >
                    <Icon className="h-4 w-4 text-brand-500" /> {cat.name}
                  </Link>
                );
              })}

              <div className="my-3 border-t border-border" />

              <Link
                href="/productos"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-fg hover:bg-surface"
              >
                Ver todo el catálogo
              </Link>
              <Link
                href="/ayuda"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-fg hover:bg-surface"
              >
                <HelpCircle className="h-4 w-4 text-muted" /> Cómo comprar
              </Link>
              <a
                href={whatsappLink()}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-fg hover:bg-surface"
              >
                <Phone className="h-4 w-4 text-muted" /> WhatsApp {site.phone}
              </a>
            </nav>

            <div className="border-t border-border p-4 text-xs text-muted">
              {site.address}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
