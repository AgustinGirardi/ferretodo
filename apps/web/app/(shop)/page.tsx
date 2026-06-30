import { Hero } from "@/components/home/hero";
import { BenefitsBar } from "@/components/home/benefits-bar";
import { CategoryGrid } from "@/components/home/category-grid";
import { ProductSection } from "@/components/home/product-section";
import { getFeatured, getBestSellers } from "@/lib/products";
import { getHomeSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [featured, bestSellers, settings] = await Promise.all([
    getFeatured(4),
    getBestSellers(4),
    getHomeSettings(),
  ]);

  return (
    <>
      <Hero />
      <BenefitsBar />
      {featured.length > 0 && (
        <ProductSection title={settings.featuredTitle} products={featured} />
      )}
      <CategoryGrid />
      {bestSellers.length > 0 && (
        <ProductSection
          title={settings.bestSellersTitle}
          products={bestSellers}
          href="/productos?sort=best_selling"
        />
      )}
    </>
  );
}
