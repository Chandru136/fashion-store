import React from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MapPin, Plus } from "lucide-react";

export default async function AddressesPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("sudha_collections_session_user");
  if (!sessionCookie?.value) redirect("/login?callbackUrl=/addresses");

  const user = JSON.parse(sessionCookie.value);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      <div className="flex items-center justify-between border-b border-ivory-300 pb-4">
        <div>
          <span className="text-xs font-bold tracking-[0.2em] text-gold-600 uppercase">My Account</span>
          <h1 className="font-serif text-3xl font-bold text-wine-900 mt-1">Saved Delivery Addresses</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        <div className="p-6 bg-white rounded-xl border-2 border-gold-500 space-y-2 shadow-md relative">
          <span className="absolute top-4 right-4 bg-gold-500 text-wine-900 font-bold text-[10px] px-2 py-0.5 rounded uppercase">
            DEFAULT
          </span>
          <h3 className="font-serif font-bold text-wine-900 text-sm">{user.name}</h3>
          <p className="text-stone-600 font-light">42, Regal Heights, Anna Nagar, Near Tower Park</p>
          <p className="text-stone-600">Chennai, Tamil Nadu - 600040</p>
          <p className="text-stone-600 font-semibold pt-1">Phone: +91 9876543210</p>
        </div>
      </div>
    </div>
  );
}
