import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ProductForm, type ProductFormData } from "@/components/admin/product-form";

export const dynamic = "force-dynamic";

function specsToText(json: string): string {
  try {
    const specs = JSON.parse(json) as { name: string; value: string }[];
    return specs.map((s) => `${s.name}: ${s.value}`).join("\n");
  } catch {
    return "";
  }
}

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, categories, brands] = await Promise.all([
    prisma.product.findUnique({ where: { id } }),
    prisma.category.findMany({ where: { isActive: true }, orderBy: { position: "asc" } }),
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!product) notFound();

  const data: ProductFormData = {
    id: product.id,
    name: product.name,
    categoryId: product.categoryId,
    brandId: product.brandId ?? "",
    price: product.price,
    previousPrice: product.previousPrice ?? "",
    cost: product.cost ?? "",
    stockQty: product.stockQty,
    sku: product.sku,
    iconName: product.iconName,
    imageUrl: product.imageUrl ?? "",
    shortDescription: product.shortDescription,
    longDescription: product.longDescription,
    specsText: specsToText(product.specsJson),
    tags: product.tags,
    isFeatured: product.isFeatured,
    isNew: product.isNew,
  };

  return (
    <div>
      <Link href="/admin/productos" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-fg">
        <ArrowLeft className="h-4 w-4" /> Volver a productos
      </Link>
      <h1 className="mb-6 text-2xl font-bold text-fg">Editar producto</h1>
      <ProductForm product={data} categories={categories} brands={brands} />
    </div>
  );
}
