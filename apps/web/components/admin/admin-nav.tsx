"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Tags,
  Tag,
  Store,
  LayoutTemplate,
  UserCog,
  ShoppingBag,
  BarChart3,
  Undo2,
  Sun,
  Moon,
} from "lucide-react";
import { useAdminTheme } from "./admin-theme";

const items = [
  { href: "/admin", label: "Inicio", icon: LayoutDashboard, exact: true },
  { href: "/admin/pedidos", label: "Pedidos", icon: ShoppingBag, exact: false },
  { href: "/admin/ventas", label: "Ventas", icon: BarChart3, exact: false },
  { href: "/admin/arrepentimientos", label: "Arrepentimientos", icon: Undo2, exact: false },
  { href: "/admin/productos", label: "Productos", icon: Package, exact: false },
  { href: "/admin/categorias", label: "Categorías", icon: Tags, exact: false },
  { href: "/admin/marcas", label: "Marcas", icon: Tag, exact: false },
  { href: "/admin/portada", label: "Portada", icon: LayoutTemplate, exact: false },
  { href: "/admin/cuenta", label: "Mi cuenta", icon: UserCog, exact: false },
];

export function AdminNav() {
  const pathname = usePathname();
  const { dark, toggle } = useAdminTheme();

  return (
    <nav className="flex flex-col gap-1 p-3">
      {items.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
              active ? "bg-brand-cta text-white" : "text-muted hover:bg-surface hover:text-fg"
            }`}
          >
            <Icon className="h-4 w-4" /> {item.label}
          </Link>
        );
      })}

      <Link
        href="/"
        target="_blank"
        className="mt-2 flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-surface hover:text-fg"
      >
        <Store className="h-4 w-4" /> Ver la tienda
      </Link>

      <button
        type="button"
        onClick={toggle}
        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-surface hover:text-fg"
      >
        {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        {dark ? "Tema claro" : "Tema oscuro"}
      </button>
    </nav>
  );
}
