import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import type { MockProduct } from "@/lib/catalog-data";

interface ProductSectionProps {
  title: string;
  products: MockProduct[];
  href?: string;
}

export function ProductSection({ title, products, href = "/productos" }: ProductSectionProps) {
  return (
    <section className="container mx-auto px-4 py-8">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-bold text-fg">{title}</h2>
        <Link
          href={href}
          className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-500"
        >
          Ver todos <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
