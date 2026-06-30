import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ProductForm, type ProductFormData } from "@/components/admin/product-form";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const [categories, brands] = await Promise.all([
    prisma.category.findMany({ where: { isActive: true }, orderBy: { position: "asc" } }),
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
  ]);

  const empty: ProductFormData = {
    name: "", categoryId: "", brandId: "",
    price: "", previousPrice: "", cost: "", stockQty: "",
    sku: "", iconName: "bolt", imageUrl: "",
    shortDescription: "", longDescription: "", specsText: "", tags: "",
    isFeatured: false, isNew: false,
  };

  return (
    <div>
      <Link href="/admin/productos" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-fg">
        <ArrowLeft className="h-4 w-4" /> Volver a productos
      </Link>
      <h1 className="mb-6 text-2xl font-bold text-fg">Nuevo producto</h1>
      <ProductForm product={empty} categories={categories} brands={brands} />
    </div>
  );
}
