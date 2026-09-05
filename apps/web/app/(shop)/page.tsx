import { Hero } from "@/components/home/hero";
import { BenefitsBar } from "@/components/home/benefits-bar";
import { CategoryGrid } from "@/components/home/category-grid";
import { ProductSection } from "@/components/home/product-section";
import { getFeatured, getBestSellers } from "@/lib/products";
import { getHomeSettings } from "@/lib/settings";

// La home NO puede cachearse con `revalidate`: eso hace que Next la prerenderice
// durante el build, y en Render el build corre antes de montar el disco donde
// vive la base (SQLite en /var/data). Probado: el build falla con
// "Unable to open the database file" al exportar "/". Es el mismo motivo por el
// que las páginas legales son dinámicas (commit b7be97b).
// La ficha de producto sí se cachea: no se prerenderiza en build porque no
// declara generateStaticParams.
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
