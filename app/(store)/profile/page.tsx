import React from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { User, Package, MapPin, Heart, ShieldCheck, LogOut } from "lucide-react";
import { verifySessionToken } from "@/lib/auth";

export default async function ProfilePage() {

  const cookieStore = await cookies();
  const token = cookieStore.get("aarna_session_user")?.value;
  const user = await verifySessionToken(token);
  if (!user) redirect("/login?callbackUrl=/profile");


  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      <div className="border-b border-ivory-300 pb-4">
        <span className="text-xs font-bold tracking-[0.2em] text-gold-600 uppercase">My Heritage Account</span>
        <h1 className="font-serif text-3xl font-bold text-wine-900 mt-1">Hello, {user.name}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Quick Navigation Cards */}
        <Link href="/orders" className="p-6 bg-white rounded-xl border gold-border hover:border-gold-500 transition-all shadow-sm space-y-2 block">
          <Package className="w-8 h-8 text-gold-600" />
          <h3 className="font-serif font-bold text-wine-900 text-base">My Orders</h3>
          <p className="text-xs text-stone-500">View order history, status tracking, and invoices.</p>
        </Link>

        <Link href="/wishlist" className="p-6 bg-white rounded-xl border gold-border hover:border-gold-500 transition-all shadow-sm space-y-2 block">
          <Heart className="w-8 h-8 text-gold-600" />
          <h3 className="font-serif font-bold text-wine-900 text-base">Saved Wishlist</h3>
          <p className="text-xs text-stone-500">Manage saved silk sarees and ethnic wear.</p>
        </Link>

        <Link href="/addresses" className="p-6 bg-white rounded-xl border gold-border hover:border-gold-500 transition-all shadow-sm space-y-2 block">
          <MapPin className="w-8 h-8 text-gold-600" />
          <h3 className="font-serif font-bold text-wine-900 text-base">Saved Addresses</h3>
          <p className="text-xs text-stone-500">Manage delivery addresses for quick express checkout.</p>
        </Link>
      </div>

      {/* Account Profile Card */}
      <div className="p-6 bg-white rounded-xl border gold-border space-y-4 shadow-sm text-xs">
        <h3 className="font-serif font-bold text-wine-900 text-base border-b border-stone-100 pb-2">Profile Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-stone-700">
          <div><strong className="text-wine-900 block font-semibold mb-1">Full Name:</strong> {user.name}</div>
          <div><strong className="text-wine-900 block font-semibold mb-1">Email Address:</strong> {user.email}</div>
          <div><strong className="text-wine-900 block font-semibold mb-1">Account Privilege:</strong> {user.role}</div>
        </div>
      </div>
    </div>
  );
}
