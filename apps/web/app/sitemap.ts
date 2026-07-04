import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true, deletedAt: null },
      select: { slug: true, updatedAt: true },
    }),
    prisma.category.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  return [
    { url: siteUrl, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/productos`, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/ayuda`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${siteUrl}/terminos`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${siteUrl}/privacidad`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${siteUrl}/arrepentimiento`, changeFrequency: "monthly", priority: 0.3 },
    ...categories.map((c) => ({
      url: `${siteUrl}/categoria/${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...products.map((p) => ({
      url: `${siteUrl}/productos/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
