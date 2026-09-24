"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { submitReviewAction } from "@/app/actions/review.actions";

export function ReviewForm({ productId }: { productId: string }) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return <form className="space-y-4" onSubmit={async event => {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    setBusy(true); setError("");
    try {
      const result = await submitReviewAction({ productId, rating, title: form.get("title"), comment: form.get("comment") });
      if (!result.success) { setError(result.error); setBusy(false); return; }
      router.push(`/reviews/thank-you?id=${encodeURIComponent(result.id)}`);
    } catch { setError("Unable to submit your review. Please try again."); setBusy(false); }
  }}>
    <fieldset disabled={busy} className="space-y-4">
      <legend className="text-sm font-semibold text-wine-900">Your rating (required)</legend>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(value => <label key={value} className="cursor-pointer rounded p-1">
          <input type="radio" name="rating" value={value} checked={rating === value} onChange={() => setRating(value)} required className="peer sr-only" />
          <span className="sr-only">{value} {value === 1 ? "star" : "stars"}</span>
          <Star aria-hidden="true" className={`h-8 w-8 rounded peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-wine-900 ${value <= rating ? "fill-gold-500 text-gold-600" : "text-stone-400"}`} />
        </label>)}
      </div>
      <label className="block text-sm font-medium text-wine-900">Title (optional)
        <input name="title" maxLength={100} className="mt-2 w-full rounded-lg border border-stone-300 bg-white p-3" placeholder="Sum up your experience" />
      </label>
      <label className="block text-sm font-medium text-wine-900">Your review (required)
        <textarea name="comment" required minLength={10} maxLength={2000} rows={5} className="mt-2 w-full rounded-lg border border-stone-300 bg-white p-3" placeholder="Tell us about the fabric, fit, quality or your experience with this product." />
      </label>
      <p className="text-xs leading-5 text-stone-600">10–2,000 characters. Please avoid personal contact details. Your first name and last initial may appear with your review after approval and publication. One review per product.</p>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <button type="submit" disabled={busy} className="rounded-lg wine-gradient-bg px-6 py-3 text-sm font-bold text-gold-300 disabled:opacity-60">{busy ? "Submitting…" : "Submit review"}</button>
    </fieldset>
  </form>;
}
