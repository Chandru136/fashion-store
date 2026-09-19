"use client";

import React, { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteCouponAction } from "@/app/actions/coupon.actions";

export function DeleteCouponButton({ id, code, hasHistory }: { id: string; code: string; hasHistory: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  if (hasHistory) return <p className="text-sm text-stone-500">This coupon has order history. Edit it and select Inactive to stop future use.</p>;
  return <>
    <button onClick={() => dialog.current?.showModal()} className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700">Delete coupon</button>
    <dialog ref={dialog} aria-labelledby="delete-coupon-title" className="m-auto max-w-md rounded-xl bg-white p-6 shadow-xl backdrop:bg-black/40">
      <h2 id="delete-coupon-title" className="text-lg font-bold text-wine-900">Delete {code}?</h2>
      <p className="my-4 text-sm text-stone-600">This removes the unused coupon permanently. It will no longer be accepted at checkout.</p>
      {error && <p role="alert" className="mb-4 text-sm text-red-700">{error}</p>}
      <div className="flex gap-3"><button disabled={pending} autoFocus onClick={() => dialog.current?.close()} className="rounded border px-4 py-2 text-sm">Cancel</button><button disabled={pending} onClick={() => {
        setError("");
        startTransition(async () => {
          try {
            const result = await deleteCouponAction(id);
            if (!result.success) { setError(result.error); return; }
            dialog.current?.close(); router.push("/admin/coupons?deleted=1"); router.refresh();
          } catch { setError("Unable to connect. Please try again."); }
        });
      }} className="rounded bg-red-700 px-4 py-2 text-sm text-white disabled:opacity-50">{pending ? "Deleting…" : "Delete coupon"}</button></div>
    </dialog>
  </>;
}
