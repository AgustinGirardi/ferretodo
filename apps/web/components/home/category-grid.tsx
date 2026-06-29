import Link from "next/link";
import { categories } from "@/lib/catalog-data";
import { iconMap } from "@/lib/icons";

export function CategoryGrid() {
  return (
    <section className="container mx-auto px-4 py-10">
      <h2 className="mb-5 text-xl font-bold text-fg">Comprá por categoría</h2>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-9">
        {categories.map((cat) => {
          const Icon = iconMap[cat.iconName];
          return (
            <Link
              key={cat.slug}
              href={`/categoria/${cat.slug}`}
              className="flex flex-col items-center gap-2 rounded-lg border border-border bg-bg p-4 text-center transition-colors hover:border-brand-500 hover:bg-brand-50"
            >
              <Icon className="h-7 w-7 text-brand-600" strokeWidth={1.5} />
              <span className="text-xs font-medium leading-tight text-fg">{cat.name}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
