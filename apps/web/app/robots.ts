import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // /uploads NO se bloquea: ahí vive cada foto de producto y para un
      // comercio local la búsqueda por imagen es tráfico gratis.
      disallow: ["/admin", "/api", "/checkout", "/carrito"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
