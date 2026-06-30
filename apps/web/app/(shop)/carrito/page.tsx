import { CartView } from "@/components/cart/cart-view";
import { getBestSellers } from "@/lib/products";

export const dynamic = "force-dynamic";

export default async function CartPage() {
  const suggestions = await getBestSellers(8);
  return <CartView suggestions={suggestions} />;
}
