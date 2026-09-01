import React from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionToken } from "@/lib/auth";
import { getAddresses, deleteAddress, setDefaultAddress } from "@/app/actions/address.actions";
import AddAddressForm from "./AddAddressForm";
import { MapPin, Trash2, Star } from "lucide-react";

export default async function AddressesPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("aarna_session_user");
  if (!sessionCookie?.value) redirect("/login?callbackUrl=/addresses");

  const addresses = await getAddresses();

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      <div className="flex items-center justify-between border-b border-ivory-300 pb-4">
        <div>
          <span className="text-xs font-bold tracking-[0.2em] text-gold-600 uppercase">My Account</span>
          <h1 className="font-serif text-3xl font-bold text-wine-900 mt-1">Saved Delivery Addresses</h1>
        </div>
      </div>

      {addresses.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border gold-border p-8 space-y-3 max-w-md mx-auto">
          <MapPin className="w-12 h-12 text-gold-500 mx-auto opacity-40" />
          <p className="text-xs text-stone-500">No saved addresses yet.</p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        {addresses.map((addr) => (
          <div
            key={addr.id}
            className={`p-6 bg-white rounded-xl border space-y-2 shadow-sm relative ${
              addr.isDefault ? "border-2 border-gold-500 shadow-md" : "gold-border"
            }`}
          >
            {addr.isDefault && (
              <span className="absolute top-4 right-4 bg-gold-500 text-wine-900 font-bold text-[10px] px-2 py-0.5 rounded uppercase">
                DEFAULT
              </span>
            )}
            <h3 className="font-serif font-bold text-wine-900 text-sm">{addr.name}</h3>
            <p className="text-stone-600 font-light">
              {addr.addressLine1}
              {addr.addressLine2 ? `, ${addr.addressLine2}` : ""}
            </p>
            <p className="text-stone-600">
              {addr.city}, {addr.state} - {addr.pincode}
            </p>
            <p className="text-stone-600 font-semibold pt-1">Phone: {addr.phone}</p>

            <div className="flex items-center gap-3 pt-2">
              {!addr.isDefault && (
                <form action={setDefaultAddress.bind(null, addr.id)}>
                  <button
                    type="submit"
                    className="flex items-center gap-1 text-wine-900 font-bold hover:underline"
                  >
                    <Star className="w-3.5 h-3.5" /> Set as default
                  </button>
                </form>
              )}
              <form action={deleteAddress.bind(null, addr.id)}>
                <button
                  type="submit"
                  className="flex items-center gap-1 text-red-600 font-bold hover:underline"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove
                </button>
              </form>
            </div>
          </div>
        ))}

        <AddAddressForm />
      </div>
    </div>
  );
}
