import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Truck, Store, MessageCircle, BadgePercent, Users } from "lucide-react";
import { Button } from "@ferretodo/ui";
import { Breadcrumbs } from "@/components/catalog/breadcrumbs";
import { ProductGallery } from "@/components/product/product-gallery";
import { RatingStars } from "@/components/product/rating-stars";
import { ProductPurchase } from "@/components/product/product-purchase";
import { ProductTabs } from "@/components/product/product-tabs";
import { ProductSection } from "@/components/home/product-section";
import { getProductBySlug, getRelated } from "@/lib/products";
import { formatPrice } from "@/lib/format";
import { whatsappLink } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Producto no encontrado" };
  return {
    title: product.name,
    description: product.shortDescription,
    openGraph: { title: product.name, description: product.shortDescription, type: "website" },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelated(product);
  const discount = product.previousPrice
    ? Math.round((1 - product.price / product.previousPrice) * 100)
    : 0;
  const installment = Math.round(product.price / 12);

  const snapshot = {
    id: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    price: product.price,
    iconName: product.iconName,
    imageUrl: product.imageUrl,
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku,
    brand: { "@type": "Brand", name: product.brand },
    description: product.shortDescription,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: product.rating,
      reviewCount: product.reviewCount,
    },
    offers: {
      "@type": "Offer",
      priceCurrency: "ARS",
      price: product.price,
      availability:
        product.stock === "out" ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
    },
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Se escapan <, > y & para que un nombre de producto no pueda cerrar el <script> (XSS). */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd)
            .replace(/</g, "\\u003c")
            .replace(/>/g, "\\u003e")
            .replace(/&/g, "\\u0026"),
        }}
      />

      <Breadcrumbs
        items={[
          { label: "Productos", href: "/productos" },
          ...(product.categorySlug
            ? [{ label: product.categoryName, href: `/categoria/${product.categorySlug}` }]
            : []),
          { label: product.name },
        ]}
      />

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {product.imageUrl ? (
          <div className="relative aspect-square min-w-0 overflow-hidden rounded-xl border border-border bg-surface">
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
              priority
            />
          </div>
        ) : (
          <ProductGallery iconName={product.iconName} alt={product.name} />
        )}

        <div className="flex min-w-0 flex-col gap-4">
          <div>
            <span className="text-sm text-muted">{product.brand}</span>
            <h1 className="text-2xl font-bold text-fg">{product.name}</h1>
            <div className="mt-2">
              <RatingStars rating={product.rating} count={product.reviewCount} />
            </div>
          </div>

          <div className="border-y border-border py-4">
            {product.previousPrice && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted line-through">
                  {formatPrice(product.previousPrice)}
                </span>
                {discount > 0 && (
                  <span className="rounded-full bg-sale px-2 py-0.5 text-xs font-medium text-white">
                    -{discount}%
                  </span>
                )}
              </div>
            )}
            <div className="text-3xl font-bold text-fg">{formatPrice(product.price)}</div>
            <p className="mt-1 text-sm font-medium text-success">
              12 cuotas de {formatPrice(installment)} sin interés
            </p>
          </div>

          <div className="flex flex-col gap-2 text-sm">
            <span className="inline-flex items-center gap-2 text-fg">
              <Store className="h-4 w-4 text-brand-600" /> Retirá hoy en el local (Río Cuarto)
            </span>
            <span className="inline-flex items-center gap-2 text-fg">
              <Truck className="h-4 w-4 text-brand-600" /> Envío a domicilio con costo por zona
            </span>
          </div>

          <div className="flex items-start gap-2 rounded-lg bg-brand-50 p-3 text-sm">
            <Users className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
            <span className="text-fg">
              <strong className="font-medium">¿Sos profesional?</strong> Constructores,
              electricistas, gasistas y plomeros tienen precios y cuenta corriente.{" "}
              <a
                href={whatsappLink("Hola, soy profesional y quería consultar precios.")}
                className="font-medium text-brand-600 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Pedí tu lista
              </a>
            </span>
          </div>

          <ProductPurchase
            item={snapshot}
            outOfStock={product.stock === "out"}
            maxQty={product.stockQty}
          />

          <a
            href={whatsappLink(`Hola, quería consultar por: ${product.name}`)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="whatsapp" size="lg" className="w-full">
              <MessageCircle className="h-5 w-5" /> Consultar por WhatsApp
            </Button>
          </a>

          {discount > 0 && (
            <p className="inline-flex items-center gap-1.5 text-xs text-muted">
              <BadgePercent className="h-3.5 w-3.5" /> Ahorrás{" "}
              {formatPrice((product.previousPrice ?? 0) - product.price)} con esta oferta
            </p>
          )}
        </div>
      </div>

      <div className="mt-10">
        <ProductTabs
          longDescription={product.longDescription}
          specs={product.specs}
          rating={product.rating}
          reviewCount={product.reviewCount}
        />
      </div>

      {related.length > 0 && (
        <ProductSection
          title="Productos relacionados"
          products={related}
          href={`/categoria/${product.categorySlug}`}
        />
      )}
    </div>
  );
}
