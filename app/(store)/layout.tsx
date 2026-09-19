import { getStorefrontCoupons } from "@/lib/services/storefront-coupon.service";

import { SESSION_COOKIE_NAME } from "@/lib/session-config";
import React from "react";
import { Header } from "@/components/navigation/Header";
import { Footer } from "@/components/common/Footer";
import { cookies } from "next/headers";
import { verifySessionToken } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  // Verifies the signature — an edited/forged cookie value now resolves to
  // null instead of being trusted, unlike the old JSON.parse() approach.
  const [user, coupons] = await Promise.all([verifySessionToken(token), getStorefrontCoupons().catch(() => [])]);
  const wishlistCount = user
    ? await prisma.wishlistItem.count({ where: { wishlist: { userId: user.id } } })
    : 0;

  return (
    <div className="sc-store min-h-screen flex flex-col bg-ivory-100 font-sans">
      <Header user={user} coupons={coupons} wishlistCount={wishlistCount} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
