import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { WhatsAppFab } from "@/components/layout/whatsapp-fab";
import { Hero } from "@/components/home/hero";
import { BenefitsBar } from "@/components/home/benefits-bar";
import { CategoryGrid } from "@/components/home/category-grid";
import { ProductSection } from "@/components/home/product-section";
import { featuredProducts, bestSellers } from "@/lib/catalog-data";

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <BenefitsBar />
        <ProductSection title="Destacados" products={featuredProducts} />
        <CategoryGrid />
        <ProductSection title="Más vendidos" products={bestSellers} href="/productos?sort=best_selling" />
      </main>
      <SiteFooter />
      <WhatsAppFab />
    </>
  );
}
