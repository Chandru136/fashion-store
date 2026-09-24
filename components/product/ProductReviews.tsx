import Link from "next/link";
import { BadgeCheck, Star } from "lucide-react";
import { prisma } from "@/lib/db";
import { getReviewSession } from "@/lib/review-session";
import { publicReviewerName, publicReviewWhere } from "@/lib/reviews";
import { pagination } from "@/lib/listing";
import { ReviewForm } from "./ReviewForm";

export async function ProductReviews({ productId, slug, page }: { productId: string; slug: string; page?: string }) {
  const actor = await getReviewSession();
  const where = { productId, ...publicReviewWhere };
  const [summary, existing] = await Promise.all([
    prisma.review.aggregate({ where, _count: true, _avg: { rating: true } }),
    actor ? prisma.review.findFirst({ where: { productId, userId: actor.id }, select: { status: true } }) : null,
  ]);
  const paging = pagination(summary._count, page, 6);
  const reviews = await prisma.review.findMany({ where, orderBy: [{ createdAt: "desc" }, { id: "asc" }], skip: paging.skip, take: paging.take,
    select: { id: true, title: true, rating: true, comment: true, createdAt: true, user: { select: {
      name: true,
      orders: {
        where: {
          paymentStatus: "PAID",
          status: { in: ["CONFIRMED", "PROCESSING", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"] },
          items: { some: { productId } },
        },
        select: { id: true },
        take: 1,
      },
    } } },
  });
  const url = `/products/${slug}`;
  return <section id="reviews" className="scroll-mt-24 border-t border-ivory-300 pt-10">
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-widest text-gold-600">From our customers</p><h2 className="mt-2 font-serif text-3xl text-wine-900">Patron Reviews</h2></div>
      <p className="text-sm text-stone-600">{summary._count ? `${summary._avg.rating?.toFixed(1)} / 5 · ${summary._count} published ${summary._count === 1 ? "review" : "reviews"}` : "Be the first to share your experience."}</p>
    </div>
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-4">
        {!reviews.length && <p className="rounded-xl border border-ivory-300 bg-ivory-50 p-6 text-sm text-stone-600">No published reviews yet. Customer feedback will appear here after moderation.</p>}
        {reviews.map(review => <article key={review.id} className="rounded-xl border border-ivory-300 bg-ivory-50 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold text-wine-900">{publicReviewerName(review.user.name)}</p><time className="text-xs text-stone-500" dateTime={review.createdAt.toISOString()}>{review.createdAt.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium" })}</time></div>
          {review.user.orders.length > 0 && <span title="This customer has a paid order for this product." className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800"><BadgeCheck aria-hidden="true" className="h-4 w-4" />Verified purchase</span>}
          <div role="img" aria-label={`${review.rating} out of 5 stars`} className="my-3 flex gap-1">{[1, 2, 3, 4, 5].map(star => <Star key={star} aria-hidden="true" className={`h-4 w-4 ${star <= review.rating ? "fill-gold-500 text-gold-600" : "text-stone-300"}`} />)}</div>
          {review.title && <h3 className="mb-2 break-words font-semibold text-wine-900">{review.title}</h3>}<p className="whitespace-pre-wrap break-words text-sm leading-6 text-stone-700">{review.comment}</p>
        </article>)}
        {paging.totalPages > 1 && <nav aria-label="Product reviews pagination" className="flex justify-between gap-3 text-sm text-wine-900">
          {paging.currentPage > 1 && <Link className="underline" href={`${url}?reviewPage=${paging.currentPage - 1}#reviews`}>Previous reviews</Link>}
          <span>Page {paging.currentPage} of {paging.totalPages}</span>
          {paging.currentPage < paging.totalPages && <Link className="underline" href={`${url}?reviewPage=${paging.currentPage + 1}#reviews`}>Next reviews</Link>}
        </nav>}
      </div>
      <div className="self-start rounded-xl border border-ivory-300 bg-ivory-50 p-6">
        <h3 className="mb-2 font-serif text-xl text-wine-900">Share your experience</h3><p className="mb-5 text-sm leading-6 text-stone-600">How did you find this product? Your feedback helps other Sudha Collections customers.</p>
        {!actor ? <Link className="font-semibold text-wine-900 underline" href={`/login?callbackUrl=${encodeURIComponent(url + "#reviews")}`}>Sign in to write a review</Link>
          : actor.role !== "CUSTOMER" ? <p className="text-sm text-stone-600">Please use a customer account to submit a review.</p>
          : existing ? <p role="status" className="text-sm text-wine-900">{existing.status === "PUBLISHED" ? "Thank you! Your review is published below the product." : existing.status === "REJECTED" ? "Your review was not selected for publication. Thank you for sharing your feedback." : "Thank you! Your review is awaiting moderation or publication."}</p>
          : <ReviewForm productId={productId} />}
      </div>
    </div>
  </section>;
}
