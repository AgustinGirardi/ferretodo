import { Hero } from "@/components/home/hero";
import { BenefitsBar } from "@/components/home/benefits-bar";
import { CategoryGrid } from "@/components/home/category-grid";
import { ProductSection } from "@/components/home/product-section";
import { featuredProducts, bestSellers } from "@/lib/catalog-data";

export default function HomePage() {
  return (
    <>
      <Hero />
      <BenefitsBar />
      <ProductSection title="Destacados" products={featuredProducts} />
      <CategoryGrid />
      <ProductSection
        title="Más vendidos"
        products={bestSellers}
        href="/productos?sort=best_selling"
      />
    </>
  );
}
