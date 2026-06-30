import { Plus, Check } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { saveBrand } from "./actions";
import { DeleteBrandButton } from "@/components/admin/delete-brand-button";

export const dynamic = "force-dynamic";

export default async function AdminBrandsPage() {
  const brands = await prisma.brand.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: { where: { deletedAt: null } } } } },
  });

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-fg">Marcas</h1>
      <p className="mb-6 text-sm text-muted">Las marcas que aparecen en los productos y filtros</p>

      <form
        action={saveBrand}
        className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4"
      >
        <label className="flex flex-1 flex-col gap-1.5 text-sm">
          <span className="font-medium text-fg">Nueva marca</span>
          <input name="name" required placeholder="Ej: Stanley" className="input" />
        </label>
        <button
          type="submit"
          className="inline-flex h-11 items-center gap-2 rounded-md bg-brand-500 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-600"
        >
          <Plus className="h-4 w-4" /> Agregar
        </button>
      </form>

      <div className="flex flex-col gap-2">
        {brands.length === 0 && (
          <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted">
            Todavía no hay marcas. Agregá la primera arriba.
          </p>
        )}
        {brands.map((b) => (
          <div
            key={b.id}
            className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface p-3"
          >
            <form action={saveBrand} className="flex flex-1 flex-wrap items-center gap-2">
              <input type="hidden" name="id" value={b.id} />
              <input
                name="name"
                defaultValue={b.name}
                className="input flex-1"
                style={{ minWidth: "160px" }}
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-2 text-sm text-fg hover:bg-bg"
              >
                <Check className="h-4 w-4" /> Guardar
              </button>
            </form>
            <span className="text-xs text-muted">{b._count.products} productos</span>
            <DeleteBrandButton id={b.id} name={b.name} />
          </div>
        ))}
      </div>
    </div>
  );
}
