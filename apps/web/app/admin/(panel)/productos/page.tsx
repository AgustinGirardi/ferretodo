import Link from "next/link";
import Image from "next/image";
import { Plus, Search, Pencil } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { iconMap } from "@/lib/icons";
import { formatPrice } from "@/lib/format";
import { DeleteProductButton } from "@/components/admin/delete-product-button";
import { Pagination, pageParam } from "@/components/ui/pagination";

export const dynamic = "force-dynamic";

const PER_PAGE = 50;

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q ?? "";
  const where = { deletedAt: null, ...(q ? { name: { contains: q } } : {}) };
  const total = await prisma.product.count({ where });
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const page = Math.min(pageParam(sp.page), pages);
  const products = await prisma.product.findMany({
    where,
    include: { category: true, brand: true },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * PER_PAGE,
    take: PER_PAGE,
  });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-fg">Productos</h1>
          <p className="text-sm text-muted">{total} productos en la tienda</p>
        </div>
        <Link
          href="/admin/productos/nuevo"
          className="inline-flex items-center gap-2 rounded-md bg-brand-cta px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-cta-hover"
        >
          <Plus className="h-4 w-4" /> Agregar producto
        </Link>
      </div>

      <form className="mb-4 flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-1">
        <Search className="h-4 w-4 text-muted" />
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por nombre…"
          className="flex-1 bg-transparent py-1.5 text-sm text-fg outline-none placeholder:text-muted"
        />
      </form>

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-surface text-left text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Producto</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">Categoría</th>
              <th className="px-4 py-3 font-medium">Precio</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">Stock</th>
              <th className="px-4 py-3 text-right font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted">
                  No hay productos. Tocá “Agregar producto” para empezar.
                </td>
              </tr>
            )}
            {products.map((p) => {
              const Icon = iconMap[p.iconName as keyof typeof iconMap] ?? iconMap.bolt;
              return (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-surface">
                        {p.imageUrl ? (
                          <Image src={p.imageUrl} alt={p.name} fill sizes="40px" className="object-contain p-0.5" />
                        ) : (
                          <Icon className="h-5 w-5 text-muted" strokeWidth={1.5} />
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-fg">{p.name}</p>
                        <p className="text-xs text-muted">{p.brand?.name ?? "Sin marca"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-muted sm:table-cell">{p.category?.name}</td>
                  <td className="px-4 py-3 text-fg">{formatPrice(p.price)}</td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <span className={p.stockQty <= 5 ? "text-warning" : "text-fg"}>{p.stockQty}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/admin/productos/${p.id}/editar`}
                        className="inline-flex items-center gap-1 text-sm text-muted hover:text-brand-500"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <DeleteProductButton id={p.id} name={p.name} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        pages={pages}
        basePath="/admin/productos"
        params={sp}
        summary={`${total} productos`}
      />
    </div>
  );
}
