"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Truck, CreditCard, Banknote, CheckCircle, Lock } from "lucide-react";
import { createOrderAction } from "@/app/actions/order.actions";

export function CheckoutFormClient({ cart, user }: { cart: any; user: any }) {
  const [shippingName, setShippingName] = useState(user.name || "");
  const [shippingPhone, setShippingPhone] = useState("+91 9876543210");
  const [shippingAddress, setShippingAddress] = useState("42, Regal Heights, Anna Nagar");
  const [shippingCity, setShippingCity] = useState("Chennai");
  const [shippingState, setShippingState] = useState("Tamil Nadu");
  const [shippingPincode, setShippingPincode] = useState("600040");
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "ONLINE">("COD");
  const [couponCode, setCouponCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const router = useRouter();

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    const res = await createOrderAction({
      shippingName,
      shippingPhone,
      shippingAddress,
      shippingCity,
      shippingState,
      shippingPincode,
      paymentMethod,
      couponCode: couponCode || undefined,
    });

    setIsSubmitting(false);

    if (res.success) {
      router.push(`/order-success?orderId=${res.orderId}&orderNumber=${res.orderNumber}`);
    } else {
      setErrorMsg(res.error || "Order placement failed");
    }
  };

  return (
    <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left: Step 1 Shipping & Payment Inputs */}
      <div className="lg:col-span-7 space-y-6">
        {/* Step 1: Address Details */}
        <div className="p-6 bg-white rounded-lg border gold-border space-y-4 shadow-sm">
          <h2 className="font-serif font-bold text-wine-900 text-base border-b border-stone-100 pb-2 flex items-center gap-2">
            <Truck className="w-5 h-5 text-gold-600" /> 1. Shipping Address Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-stone-700 block mb-1">Full Name</label>
              <input
                type="text"
                required
                value={shippingName}
                onChange={(e) => setShippingName(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded focus:outline-none focus:border-gold-500"
              />
            </div>
            <div>
              <label className="font-bold text-stone-700 block mb-1">Phone Number</label>
              <input
                type="text"
                required
                value={shippingPhone}
                onChange={(e) => setShippingPhone(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded focus:outline-none focus:border-gold-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="font-bold text-stone-700 block mb-1">Flat / House No. / Street Address</label>
              <input
                type="text"
                required
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded focus:outline-none focus:border-gold-500"
              />
            </div>
            <div>
              <label className="font-bold text-stone-700 block mb-1">City</label>
              <input
                type="text"
                required
                value={shippingCity}
                onChange={(e) => setShippingCity(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded focus:outline-none focus:border-gold-500"
              />
            </div>
            <div>
              <label className="font-bold text-stone-700 block mb-1">State</label>
              <input
                type="text"
                required
                value={shippingState}
                onChange={(e) => setShippingState(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded focus:outline-none focus:border-gold-500"
              />
            </div>
            <div>
              <label className="font-bold text-stone-700 block mb-1">6-Digit Pincode</label>
              <input
                type="text"
                required
                value={shippingPincode}
                onChange={(e) => setShippingPincode(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded focus:outline-none focus:border-gold-500"
              />
            </div>
          </div>
        </div>

        {/* Step 2: Payment Method */}
        <div className="p-6 bg-white rounded-lg border gold-border space-y-4 shadow-sm">
          <h2 className="font-serif font-bold text-wine-900 text-base border-b border-stone-100 pb-2 flex items-center gap-2">
            <Lock className="w-5 h-5 text-gold-600" /> 2. Payment Method
          </h2>

          <div className="space-y-3">
            <label className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all ${
              paymentMethod === "COD" ? "border-gold-500 bg-ivory-50 shadow-sm" : "border-stone-200"
            }`}>
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "COD"}
                  onChange={() => setPaymentMethod("COD")}
                  className="w-4 h-4 text-gold-600"
                />
                <div>
                  <p className="font-bold text-xs text-wine-900 flex items-center gap-1.5">
                    <Banknote className="w-4 h-4 text-emerald-700" /> Cash on Delivery (COD)
                  </p>
                  <p className="text-[11px] text-stone-500">Pay cash or UPI at your doorstep upon order delivery.</p>
                </div>
              </div>
            </label>

            <label className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all ${
              paymentMethod === "ONLINE" ? "border-gold-500 bg-ivory-50 shadow-sm" : "border-stone-200"
            }`}>
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "ONLINE"}
                  onChange={() => setPaymentMethod("ONLINE")}
                  className="w-4 h-4 text-gold-600"
                />
                <div>
                  <p className="font-bold text-xs text-wine-900 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-wine-800" /> Instant Online Payment (Razorpay / Cards / UPI)
                  </p>
                  <p className="text-[11px] text-stone-500">Secure 256-Bit SSL Instant Verification.</p>
                </div>
              </div>
            </label>
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 bg-red-50 text-red-700 text-xs font-bold rounded border border-red-200">
            ⚠ {errorMsg}
          </div>
        )}
      </div>

      {/* Right: Summary Column */}
      <div className="lg:col-span-5 space-y-6">
        <div className="p-6 bg-ivory-50 rounded-lg border gold-border space-y-4 shadow-md sticky top-28">
          <h3 className="font-serif font-bold text-wine-900 text-sm border-b border-ivory-300 pb-2">
            Bag Items ({cart.items.length})
          </h3>

          <div className="max-h-60 overflow-y-auto space-y-3 pr-1">
            {cart.items.map((item: any) => (
              <div key={item.id} className="flex gap-3 text-xs">
                <img src={item.image} alt={item.productName} className="w-14 h-16 object-cover rounded bg-stone-100 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-wine-900 line-clamp-1">{item.productName}</p>
                  <p className="text-[11px] text-stone-500">Qty: {item.quantity}</p>
                  <p className="font-bold text-wine-800 mt-1">₹{item.price.toLocaleString("en-IN")}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2 pt-3 border-t border-ivory-300 text-xs text-stone-700">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-bold text-wine-900">₹{cart.subtotal.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between">
              <span>GST Tax (5%)</span>
              <span>₹{cart.tax.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery</span>
              <span className="text-emerald-700 font-bold">{cart.shipping === 0 ? "FREE" : `₹${cart.shipping}`}</span>
            </div>
            <div className="flex justify-between pt-3 border-t border-ivory-300 text-sm font-bold text-wine-900">
              <span>Total Payable</span>
              <span className="text-lg text-wine-800">₹{cart.grandTotal.toLocaleString("en-IN")}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 wine-gradient-bg text-gold-300 font-bold text-xs uppercase tracking-widest rounded gold-border shadow-xl hover:brightness-110 transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? "Processing Transaction..." : "Place Order & Pay"}
          </button>
        </div>
      </div>
    </form>
  );
}
