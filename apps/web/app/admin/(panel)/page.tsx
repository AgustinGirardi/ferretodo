import Link from "next/link";
import { Package, Tags, AlertTriangle, BadgePercent, Plus, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getStats() {
  const [products, categories, lowStock, onSale] = await Promise.all([
    prisma.product.count({ where: { deletedAt: null } }),
    prisma.category.count({ where: { isActive: true } }),
    prisma.product.count({ where: { deletedAt: null, stockQty: { lte: 5 } } }),
    prisma.product.count({ where: { deletedAt: null, previousPrice: { not: null } } }),
  ]);
  return { products, categories, lowStock, onSale };
}

export default async function AdminDashboard() {
  const stats = await getStats();

  const cards = [
    { label: "Productos", value: stats.products, icon: Package, href: "/admin/productos" },
    { label: "Categorías", value: stats.categories, icon: Tags, href: "/admin/categorias" },
    { label: "Stock bajo", value: stats.lowStock, icon: AlertTriangle, href: "/admin/productos" },
    { label: "En oferta", value: stats.onSale, icon: BadgePercent, href: "/admin/productos" },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-fg">Inicio</h1>
          <p className="text-sm text-muted">Resumen de tu tienda</p>
        </div>
        <Link
          href="/admin/productos/nuevo"
          className="inline-flex items-center gap-2 rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600"
        >
          <Plus className="h-4 w-4" /> Agregar producto
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.label}
              href={c.href}
              className="rounded-xl border border-border bg-surface p-4 transition-colors hover:border-brand-500"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">{c.label}</span>
                <Icon className="h-4 w-4 text-muted" />
              </div>
              <div className="mt-2 text-3xl font-bold text-fg">{c.value}</div>
            </Link>
          );
        })}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/productos"
          className="flex items-center justify-between rounded-xl border border-border bg-surface p-5 transition-colors hover:border-brand-500"
        >
          <div>
            <h2 className="font-medium text-fg">Gestionar productos</h2>
            <p className="text-sm text-muted">Agregar, editar fotos, precios y stock</p>
          </div>
          <ArrowRight className="h-5 w-5 text-muted" />
        </Link>
        <Link
          href="/admin/categorias"
          className="flex items-center justify-between rounded-xl border border-border bg-surface p-5 transition-colors hover:border-brand-500"
        >
          <div>
            <h2 className="font-medium text-fg">Gestionar categorías</h2>
            <p className="text-sm text-muted">Crear y organizar las secciones de la tienda</p>
          </div>
          <ArrowRight className="h-5 w-5 text-muted" />
        </Link>
      </div>
    </div>
  );
}
