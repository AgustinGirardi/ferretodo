import { NextResponse } from "next/server";
import { searchProducts } from "@/lib/products";
import { clientIp } from "@/lib/client-ip";
import { isRateLimited } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // El autocompletado consulta cada 200 ms mientras se escribe, así que el tope
  // es generoso; alcanza para frenar a quien la use para saturar el servidor.
  if (isRateLimited(`search:${await clientIp()}`, 120, 60_000)) {
    return NextResponse.json([], { status: 429 });
  }

  const q = (new URL(request.url).searchParams.get("q") ?? "").slice(0, 100);
  const results = await searchProducts(q, 6);
  return NextResponse.json(
    results.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      brand: p.brand,
      price: p.price,
      iconName: p.iconName,
    })),
  );
}
