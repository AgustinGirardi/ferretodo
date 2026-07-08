import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { Reveal } from "@/components/ui/reveal";
import type { Product } from "@/lib/products";

interface ProductSectionProps {
  title: string;
  products: Product[];
  href?: string;
}

export function ProductSection({ title, products, href = "/productos" }: ProductSectionProps) {
  return (
    <section className="container mx-auto px-4 py-8">
      <Reveal>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-fg">{title}</h2>
          <Link
            href={href}
            className="group inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-500"
          >
            Ver todos{" "}
            <ArrowRight className="h-4 w-4 transition-transform motion-safe:group-hover:translate-x-0.5" />
          </Link>
        </div>
      </Reveal>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((product, i) => (
          <Reveal key={product.id} delay={Math.min(i, 3) * 80} className="flex">
            <ProductCard product={product} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
