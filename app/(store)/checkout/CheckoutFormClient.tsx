"use client";

import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CouponControl, useCartCoupon } from "@/components/cart/CouponControl";
import Link from "next/link";
import { Truck, CreditCard, Lock, MapPin, Plus } from "lucide-react";
import { openOrderPayment } from "@/lib/payments/checkout.client";
import { createOrderAction } from "@/app/actions/order.actions";
import { Loader } from "@/components/common/Loader";

type SavedAddress = {
  id: string;
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
};

export function CheckoutFormClient({ cart, addresses }: { cart: any; addresses: SavedAddress[] }) {
  const [shippingAddressId, setShippingAddressId] = useState(addresses[0]?.id || "");
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [billingAddressId, setBillingAddressId] = useState(addresses[0]?.id || "");
  const coupon = useCartCoupon(cart);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const router = useRouter();
  const checkoutKey = useRef<string | null>(null);
  const submitting = useRef(false);
  const pendingOrder = useRef<string | null>(null);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting.current || coupon.pending) return;
    submitting.current = true;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      if (pendingOrder.current) {
        const paid = await openOrderPayment(pendingOrder.current);
        router.push(paid ? `/order-success?orderId=${pendingOrder.current}` : `/orders/${pendingOrder.current}`);
        return;
      }
      checkoutKey.current ||= crypto.randomUUID();
      const res = await createOrderAction({
        checkoutKey: checkoutKey.current,
        shippingAddressId,
        billingAddressId: billingSameAsShipping ? undefined : billingAddressId,
        paymentMethod: "ONLINE",
        couponCode: coupon.applied?.code || undefined,
      });
      if (!res.success || !res.orderId) throw new Error(res.error || "Order placement failed");
      pendingOrder.current = res.orderId;
      const paid = await openOrderPayment(res.orderId);
      router.push(paid ? `/order-success?orderId=${res.orderId}` : `/orders/${res.orderId}`);
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "Order placement failed. Please retry.");
    } finally {
      submitting.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left: Step 1 Shipping & Payment Inputs */}
      <div className="lg:col-span-7 space-y-6">
        {/* Step 1: Address Details */}
        <div className="p-6 bg-ivory-50 rounded-lg border gold-border space-y-4 shadow-sm">
          <h2 className="font-serif font-bold text-wine-900 text-base border-b border-stone-100 pb-2 flex items-center gap-2">
            <Truck className="w-5 h-5 text-gold-600" /> 1. Shipping Address Details
          </h2>

          {addresses.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gold-400 bg-ivory-50 p-6 text-center">
              <MapPin className="mx-auto mb-2 h-8 w-8 text-gold-600" />
              <p className="mb-3 text-xs text-stone-600">Add a delivery address before placing your order.</p>
              <Link href="/addresses?returnTo=/checkout&add=1" className="inline-flex items-center gap-1 rounded bg-wine-900 px-4 py-2 text-xs font-bold text-white">
                <Plus className="h-4 w-4" /> Add address
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
              {addresses.map((address) => (
                <label key={address.id} className={`cursor-pointer rounded-lg border p-4 ${shippingAddressId === address.id ? "border-gold-500 bg-ivory-50 ring-1 ring-gold-400" : "border-stone-200"}`}>
                  <input type="radio" name="shippingAddress" className="sr-only" checked={shippingAddressId === address.id} onChange={() => setShippingAddressId(address.id)} />
                  <span className="font-bold text-wine-900">{address.name}{address.isDefault ? " · Default" : ""}</span>
                  <span className="mt-1 block text-stone-600">{address.addressLine1}{address.addressLine2 ? `, ${address.addressLine2}` : ""}</span>
                  <span className="block text-stone-600">{address.city}, {address.state} - {address.pincode}</span>
                  <span className="mt-1 block text-stone-600">{address.phone}</span>
                </label>
              ))}
              <Link href="/addresses?returnTo=/checkout&add=1" className="flex min-h-28 items-center justify-center gap-1 rounded-lg border border-dashed border-gold-400 font-bold text-wine-900 hover:bg-ivory-50">
                <Plus className="h-4 w-4" /> Manage addresses
              </Link>
            </div>
          )}
        </div>

        <div className="p-6 bg-ivory-50 rounded-lg border gold-border space-y-4 shadow-sm">
          <h2 className="font-serif font-bold text-wine-900 text-base border-b border-stone-100 pb-2">2. Billing Address</h2>
          <label className="flex items-center gap-2 text-xs font-bold text-stone-700">
            <input type="checkbox" checked={billingSameAsShipping} onChange={(e) => setBillingSameAsShipping(e.target.checked)} />
            Billing address is the same as shipping address
          </label>
          {!billingSameAsShipping && (
            <select required value={billingAddressId} onChange={(e) => setBillingAddressId(e.target.value)} className="w-full rounded border border-stone-300 px-3 py-2 text-xs">
              {addresses.map((address) => <option key={address.id} value={address.id}>{address.name} — {address.addressLine1}, {address.city}</option>)}
            </select>
          )}
        </div>

        {/* Step 2: Payment Method */}
        <div className="p-6 bg-ivory-50 rounded-lg border gold-border space-y-4 shadow-sm">
          <h2 className="font-serif font-bold text-wine-900 text-base border-b border-stone-100 pb-2 flex items-center gap-2">
            <Lock className="w-5 h-5 text-gold-600" /> 3. Payment Method
          </h2>

          <div className="flex items-center gap-3 p-4 rounded-lg border border-gold-500 bg-ivory-50 shadow-sm">
            <CreditCard className="w-5 h-5 text-wine-800" />
            <div>
              <p className="font-bold text-xs text-wine-900">Online Payment (Razorpay)</p>
              <p className="text-[11px] text-stone-500">Pay securely using UPI, cards, netbanking or wallets.</p>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 bg-red-50 text-red-700 text-xs font-bold rounded border border-red-200">
            ⚠ {errorMsg}
            {pendingOrder.current && <Link href={`/orders/${pendingOrder.current}`} className="block mt-2 underline">View order and retry payment</Link>}
          </div>
        )}
      </div>

      {/* Right: Summary Column */}
      <div className="lg:col-span-5 space-y-6">
        <CouponControl coupon={coupon} disabled={isSubmitting || Boolean(pendingOrder.current)} />
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
            {coupon.applied && <div className="flex justify-between text-emerald-700"><span>Coupon ({coupon.applied.code})</span><span>-?{coupon.applied.discountAmount.toLocaleString("en-IN")}</span></div>}
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-bold text-wine-900">₹{cart.subtotal.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between">
              <span>GST Tax</span>
              <span>₹{(coupon.applied?.tax ?? cart.tax).toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery</span>
              <span className="text-emerald-700 font-bold">{cart.shipping === 0 ? "FREE" : `₹${cart.shipping}`}</span>
            </div>
            <div className="flex justify-between pt-3 border-t border-ivory-300 text-sm font-bold text-wine-900">
              <span>Total Payable</span>
              <span className="text-lg text-wine-800">₹{(coupon.applied?.grandTotal ?? cart.grandTotal).toLocaleString("en-IN")}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || coupon.pending || addresses.length === 0}
            className="w-full py-4 wine-gradient-bg text-gold-300 font-bold text-xs uppercase tracking-widest rounded gold-border shadow-xl hover:brightness-110 transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader size="xs" color="gold" />
                <span>Opening Payment Gateway...</span>
              </>
            ) : (
              "Pay Securely"
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
