"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Truck, CreditCard, Banknote, CheckCircle, Lock } from "lucide-react";
import { createOrderAction } from "@/app/actions/order.actions";

export function CheckoutFormClient({ cart, user, defaultAddress }: { cart: any; user: any; defaultAddress?: any }) {
  const [shippingName, setShippingName] = useState(defaultAddress?.name || user.name || "");
  const [shippingPhone, setShippingPhone] = useState(defaultAddress?.phone || "");
  const [shippingAddress, setShippingAddress] = useState([defaultAddress?.addressLine1, defaultAddress?.addressLine2].filter(Boolean).join(", "));
  const [shippingCity, setShippingCity] = useState(defaultAddress?.city || "");
  const [shippingState, setShippingState] = useState(defaultAddress?.state || "");
  const [shippingPincode, setShippingPincode] = useState(defaultAddress?.pincode || "");
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [billingName, setBillingName] = useState(defaultAddress?.name || user.name || "");
  const [billingPhone, setBillingPhone] = useState(defaultAddress?.phone || "");
  const [billingAddress, setBillingAddress] = useState([defaultAddress?.addressLine1, defaultAddress?.addressLine2].filter(Boolean).join(", "));
  const [billingCity, setBillingCity] = useState(defaultAddress?.city || "");
  const [billingState, setBillingState] = useState(defaultAddress?.state || "");
  const [billingPincode, setBillingPincode] = useState(defaultAddress?.pincode || "");
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
      billingName: billingSameAsShipping ? shippingName : billingName,
      billingPhone: billingSameAsShipping ? shippingPhone : billingPhone,
      billingAddress: billingSameAsShipping ? shippingAddress : billingAddress,
      billingCity: billingSameAsShipping ? shippingCity : billingCity,
      billingState: billingSameAsShipping ? shippingState : billingState,
      billingPincode: billingSameAsShipping ? shippingPincode : billingPincode,
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
                type="tel"
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
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                value={shippingPincode}
                onChange={(e) => setShippingPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="w-full px-3 py-2 border border-stone-300 rounded focus:outline-none focus:border-gold-500"
              />
            </div>
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg border gold-border space-y-4 shadow-sm">
          <h2 className="font-serif font-bold text-wine-900 text-base border-b border-stone-100 pb-2">2. Billing Address</h2>
          <label className="flex items-center gap-2 text-xs font-bold text-stone-700">
            <input type="checkbox" checked={billingSameAsShipping} onChange={(e) => setBillingSameAsShipping(e.target.checked)} />
            Billing address is the same as shipping address
          </label>
          {!billingSameAsShipping && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <label className="font-bold text-stone-700">Full Name<input required value={billingName} onChange={(e) => setBillingName(e.target.value)} className="mt-1 w-full px-3 py-2 border border-stone-300 rounded font-normal" /></label>
              <label className="font-bold text-stone-700">Phone Number<input type="tel" required value={billingPhone} onChange={(e) => setBillingPhone(e.target.value)} className="mt-1 w-full px-3 py-2 border border-stone-300 rounded font-normal" /></label>
              <label className="sm:col-span-2 font-bold text-stone-700">Billing Address<input required value={billingAddress} onChange={(e) => setBillingAddress(e.target.value)} className="mt-1 w-full px-3 py-2 border border-stone-300 rounded font-normal" /></label>
              <label className="font-bold text-stone-700">City<input required value={billingCity} onChange={(e) => setBillingCity(e.target.value)} className="mt-1 w-full px-3 py-2 border border-stone-300 rounded font-normal" /></label>
              <label className="font-bold text-stone-700">State<input required value={billingState} onChange={(e) => setBillingState(e.target.value)} className="mt-1 w-full px-3 py-2 border border-stone-300 rounded font-normal" /></label>
              <label className="font-bold text-stone-700">6-Digit Pincode<input inputMode="numeric" pattern="[0-9]{6}" required value={billingPincode} onChange={(e) => setBillingPincode(e.target.value.replace(/\D/g, "").slice(0, 6))} className="mt-1 w-full px-3 py-2 border border-stone-300 rounded font-normal" /></label>
            </div>
          )}
        </div>

        {/* Step 2: Payment Method */}
        <div className="p-6 bg-white rounded-lg border gold-border space-y-4 shadow-sm">
          <h2 className="font-serif font-bold text-wine-900 text-base border-b border-stone-100 pb-2 flex items-center gap-2">
            <Lock className="w-5 h-5 text-gold-600" /> 3. Payment Method
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

            <label className="flex items-center justify-between p-4 rounded-lg border border-stone-200 bg-stone-50 opacity-60 cursor-not-allowed">
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "ONLINE"}
                  disabled
                  onChange={() => undefined}
                  className="w-4 h-4 text-gold-600"
                />
                <div>
                  <p className="font-bold text-xs text-wine-900 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-wine-800" /> Online Payment (Coming Soon)
                  </p>
                  <p className="text-[11px] text-stone-500">A verified payment gateway must be connected before this option can be used.</p>
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
                  <p className="font-bold text-wine-800 mt-1">₹{item.itemTotal.toLocaleString("en-IN")}</p>
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
              <span>GST Tax</span>
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
            {isSubmitting ? "Placing Order..." : "Place Order"}
          </button>
        </div>
      </div>
    </form>
  );
}
