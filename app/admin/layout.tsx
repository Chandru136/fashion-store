import React from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionToken } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const headerList = await headers();
  const pathname = headerList.get("x-invoke-path") || "";

  const cookieStore = await cookies();
  const token = cookieStore.get("aarna_session_user")?.value;

  // Verified from the JWT signature, not just decoded — a tampered cookie
  // (e.g. hand-edited role field) fails verification and resolves to null
  // here rather than being trusted.
  const user = await verifySessionToken(token);

  // Bypass layout sidebar for login page
  if (!user || user.role === "CUSTOMER") {
    return <div className="min-h-screen bg-stone-100 font-sans">{children}</div>;
  }

  return (
    <div className="min-h-screen flex bg-stone-100 font-sans">
      <AdminSidebar user={user} />
      <div className="flex-1 flex flex-col overflow-y-auto">
        <header className="bg-white border-b border-stone-200 px-8 py-4 flex items-center justify-between shadow-sm sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-wine-900">
              Aarna Heritage Administration Systems
            </span>
          </div>
          <div className="text-xs text-stone-500 font-mono">
            Session: <strong className="text-wine-900">{user.email}</strong> [{user.role}]
          </div>
        </header>

        <main className="p-8 flex-1">{children}</main>
      </div>
    </div>
  );
}
