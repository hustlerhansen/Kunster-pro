import type { Metadata } from "next";
import { CartPageClient } from "@/components/shop/cart/cart-page";

export const metadata: Metadata = { title: "Handlekurv", robots: { index: false } };

export default function CartPage() {
  return (
    <div className="container-page py-8">
      <h1 className="mb-6 text-4xl font-semibold">Handlekurv</h1>
      <CartPageClient />
    </div>
  );
}
