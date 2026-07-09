import Link from "next/link";
import { Phone, Truck, Clock, User } from "lucide-react";
import { site } from "@/lib/site";
import { getCategories, type Category } from "@/lib/products";
import { iconMap } from "@/lib/icons";
import { CartLink } from "./cart-link";
import { HideOnRoutes } from "./hide-on-routes";
import { LogoMark } from "./logo-mark";
import { MobileMenu } from "./mobile-menu";
import { ThemeToggle } from "./theme-toggle";
import { SearchBar } from "@/components/search/search-bar";

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

function MainBar({ categories }: { categories: Category[] }) {
  return (
    <div className="border-b border-border bg-bg">
      <div className="container mx-auto flex h-16 items-center gap-3 px-4 sm:gap-5">
        <MobileMenu categories={categories} />

        <Link href="/" className="flex shrink-0 items-center gap-2 text-xl font-bold tracking-tight text-fg">
          <LogoMark className="h-7 w-7" />
          <span>
            FERRE<span className="text-brand-500">TODO</span>
          </span>
        </Link>

        <SearchBar className="hidden flex-1 sm:block" />

        <div className="ml-auto flex items-center gap-2 sm:ml-0 sm:gap-4">
          <ThemeToggle />
          <Link
            href="/cuenta"
            className="inline-flex items-center gap-1.5 text-sm text-fg hover:text-brand-600"
          >
            <User className="h-5 w-5" />
            <span className="hidden md:inline">Mi cuenta</span>
          </Link>
          <CartLink />
        </div>
      </div>
    </div>
  );
}

function CategoryChips({ categories }: { categories: Category[] }) {
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

export async function SiteHeader() {
  const categories = await getCategories();
  return (
    <header className="sticky top-0 z-40">
      <UtilityBar />
      <MainBar categories={categories} />
      {/* En "Mi cuenta" la barra de categorías se oculta para dejar el login limpio. */}
      <HideOnRoutes routes={["/cuenta"]}>
        <CategoryChips categories={categories} />
      </HideOnRoutes>
    </header>
  );
}
