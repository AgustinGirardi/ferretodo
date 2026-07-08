import Link from "next/link";
import { getCategories } from "@/lib/products";
import { iconMap } from "@/lib/icons";
import { Reveal } from "@/components/ui/reveal";

export async function CategoryGrid() {
  const categories = await getCategories();
  if (categories.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-10">
      <Reveal>
        <h2 className="mb-5 text-xl font-bold text-fg">Comprá por categoría</h2>
      </Reveal>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-9">
        {categories.map((cat, i) => {
          const Icon = iconMap[cat.iconName];
          return (
            <Reveal key={cat.slug} delay={Math.min(i, 8) * 40} className="flex">
              <Link
                href={`/categoria/${cat.slug}`}
                className="group flex w-full flex-col items-center gap-2 rounded-lg border border-border bg-bg p-4 text-center transition-all duration-200 hover:border-brand-500 hover:bg-brand-50 hover:shadow-md motion-safe:hover:-translate-y-0.5"
              >
                <Icon
                  className="h-7 w-7 text-brand-600 transition-transform duration-200 motion-safe:group-hover:scale-110"
                  strokeWidth={1.5}
                />
                <span className="text-xs font-medium leading-tight text-fg">{cat.name}</span>
              </Link>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
