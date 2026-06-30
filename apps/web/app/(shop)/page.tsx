import { Hero } from "@/components/home/hero";
import { BenefitsBar } from "@/components/home/benefits-bar";
import { CategoryGrid } from "@/components/home/category-grid";
import { ProductSection } from "@/components/home/product-section";
import { getFeatured, getBestSellers } from "@/lib/products";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [featured, bestSellers] = await Promise.all([getFeatured(4), getBestSellers(4)]);

  return (
    <>
      <Hero />
      <BenefitsBar />
      {featured.length > 0 && <ProductSection title="Destacados" products={featured} />}
      <CategoryGrid />
      {bestSellers.length > 0 && (
        <ProductSection
          title="Más vendidos"
          products={bestSellers}
          href="/productos?sort=best_selling"
        />
      )}
    </>
  );
}
