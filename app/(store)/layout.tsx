import React from "react";
import { Header } from "@/components/navigation/Header";
import { Footer } from "@/components/common/Footer";
import { cookies } from "next/headers";

export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("aarna_session_user");
  let user = null;

  if (sessionCookie?.value) {
    try {
      user = JSON.parse(sessionCookie.value);
    } catch (e) {}
  }

  return (
    <div className="min-h-screen flex flex-col bg-ivory-100 font-sans">
      <Header user={user} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
