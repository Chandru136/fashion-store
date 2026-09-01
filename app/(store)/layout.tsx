import React from "react";
import { Header } from "@/components/navigation/Header";
import { Footer } from "@/components/common/Footer";
import { cookies } from "next/headers";
import { verifySessionToken } from "@/lib/auth";

export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("aarna_session_user")?.value;

  // Verifies the signature — an edited/forged cookie value now resolves to
  // null instead of being trusted, unlike the old JSON.parse() approach.
  const user = await verifySessionToken(token);

  return (
    <div className="min-h-screen flex flex-col bg-ivory-100 font-sans">
      <Header user={user} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}