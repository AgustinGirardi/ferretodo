import { Plus, Check } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { iconMap } from "@/lib/icons";
import { saveCategory } from "./actions";
import { DeleteCategoryButton } from "@/components/admin/delete-category-button";

export const dynamic = "force-dynamic";

const ICONS: [string, string][] = [
  ["plug", "H. eléctrica"], ["wrench", "Herramienta"], ["hammer", "Martillo"],
  ["zap", "Electricidad"], ["droplets", "Plomería"], ["paintBucket", "Pinturería"],
  ["hardHat", "Construcción"], ["bolt", "Ferretería"], ["shovel", "Jardín"],
  ["shieldCheck", "Seguridad"],
];

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { position: "asc" },
    include: { _count: { select: { products: { where: { deletedAt: null } } } } },
  });

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-fg">Categorías</h1>
      <p className="mb-6 text-sm text-muted">Las secciones que ve el cliente en la tienda</p>

      {/* Agregar */}
      <form
        action={saveCategory}
        className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4"
      >
        <label className="flex flex-1 flex-col gap-1.5 text-sm">
          <span className="font-medium text-fg">Nueva categoría</span>
          <input name="name" required pattern=".*\S.*" title="Escribí un nombre" placeholder="Ej: Cerrajería" className="input" />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-fg">Ícono</span>
          <select name="iconName" defaultValue="bolt" className="input">
            {ICONS.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="inline-flex h-11 items-center gap-2 rounded-md bg-brand-cta px-4 text-sm font-medium text-white transition-colors hover:bg-brand-cta-hover"
        >
          <Plus className="h-4 w-4" /> Agregar
        </button>
      </form>

      {/* Lista */}
      <div className="flex flex-col gap-2">
        {categories.map((cat) => {
          const Icon = iconMap[cat.iconName as keyof typeof iconMap] ?? iconMap.bolt;
          return (
            <div
              key={cat.id}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface p-3"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-bg text-brand-500">
                <Icon className="h-5 w-5" />
              </span>

              <form action={saveCategory} className="flex flex-1 flex-wrap items-center gap-2">
                <input type="hidden" name="id" value={cat.id} />
                <input
                  name="name"
                  defaultValue={cat.name}
                  required
                  pattern=".*\S.*"
                  title="Escribí un nombre"
                  className="input flex-1"
                  style={{ minWidth: "140px" }}
                />
                <select name="iconName" defaultValue={cat.iconName} className="input w-auto">
                  {ICONS.map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-2 text-sm text-fg hover:bg-bg"
                >
                  <Check className="h-4 w-4" /> Guardar
                </button>
              </form>

              <span className="text-xs text-muted">{cat._count.products} productos</span>
              <DeleteCategoryButton id={cat.id} name={cat.name} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
