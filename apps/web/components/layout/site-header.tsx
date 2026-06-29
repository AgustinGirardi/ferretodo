import Link from "next/link";
import { Phone, Truck, Clock, Search, User, ShoppingCart, Menu } from "lucide-react";
import { site } from "@/lib/site";
import { categories } from "@/lib/catalog-data";
import { iconMap } from "@/lib/icons";

function UtilityBar() {
  return (
    <div className="bg-[#0f172a] text-[#cbd5e1]">
      <div className="container mx-auto flex h-9 items-center gap-5 px-4 text-xs">
        <a href={`tel:${site.phone}`} className="inline-flex items-center gap-1.5 hover:text-white">
          <Phone className="h-3.5 w-3.5" /> {site.phone}
        </a>
        <span className="hidden items-center gap-1.5 sm:inline-flex">
          <Truck className="h-3.5 w-3.5" /> Envíos en {site.city}
        </span>
        <span className="ml-auto hidden items-center gap-1.5 md:inline-flex">
          <Clock className="h-3.5 w-3.5" /> Lun a Vie 8–12 / 15:30–19:30 · Sáb 8:30–13
        </span>
      </div>
    </div>
  );
}

function MainBar() {
  return (
    <div className="border-b border-border bg-bg">
      <div className="container mx-auto flex h-16 items-center gap-3 px-4 sm:gap-5">
        <button className="lg:hidden" aria-label="Abrir menú">
          <Menu className="h-6 w-6 text-fg" />
        </button>

        <Link href="/" className="shrink-0 text-xl font-bold tracking-tight text-fg">
          FERRE<span className="text-brand-500">TODO</span>
        </Link>

        <form
          action="/buscar"
          className="hidden flex-1 items-center overflow-hidden rounded-md border border-border focus-within:border-brand-500 sm:flex"
        >
          <input
            name="q"
            placeholder="Buscar productos, marcas o códigos..."
            className="flex-1 bg-transparent px-4 py-2.5 text-sm text-fg outline-none placeholder:text-muted"
            aria-label="Buscar productos"
          />
          <button
            type="submit"
            className="flex h-full items-center bg-brand-500 px-4 text-white transition-colors hover:bg-brand-600"
            aria-label="Buscar"
          >
            <Search className="h-5 w-5" />
          </button>
        </form>

        <div className="ml-auto flex items-center gap-4 sm:ml-0">
          <Link
            href="/cuenta"
            className="inline-flex items-center gap-1.5 text-sm text-fg hover:text-brand-600"
          >
            <User className="h-5 w-5" />
            <span className="hidden md:inline">Mi cuenta</span>
          </Link>
          <Link
            href="/carrito"
            className="relative inline-flex items-center gap-1.5 text-sm text-fg hover:text-brand-600"
          >
            <ShoppingCart className="h-5 w-5" />
            <span className="hidden md:inline">Carrito</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function CategoryChips() {
  return (
    <nav className="border-b border-border bg-bg" aria-label="Categorías">
      <div className="container mx-auto flex gap-2 overflow-x-auto px-4 py-2.5">
        {categories.map((cat) => {
          const Icon = iconMap[cat.iconName];
          return (
            <Link
              key={cat.slug}
              href={`/categoria/${cat.slug}`}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-xs font-medium text-fg transition-colors hover:bg-brand-50 hover:text-brand-600"
            >
              <Icon className="h-3.5 w-3.5" /> {cat.name}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40">
      <UtilityBar />
      <MainBar />
      <CategoryChips />
    </header>
  );
}
