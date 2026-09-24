import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getReviewSession } from "@/lib/review-session";
import { requireReviewManager } from "@/lib/services/review.service";
import { reviewStatuses } from "@/lib/reviews";
import { choice, dateSorts, options, pagination, value, type ListPageProps } from "@/lib/listing";
import { ListControls, Pagination } from "@/components/common/ListControls";
import { ReviewModerationControls } from "./ReviewModerationControls";

export const metadata = { title: "Patron Reviews | Sudha Collections" };

export default async function ReviewsPage({ searchParams }: ListPageProps) {
  const actor = await getReviewSession();
  try { requireReviewManager(actor); }
  catch { return <p role="alert">You do not have permission to manage reviews.</p>; }
  const params = await searchParams;
  const status = choice(params, "status", reviewStatuses);
  const rating = choice(params, "rating", ["1", "2", "3", "4", "5"]);
  const q = value(params, "q");
  const where: Prisma.ReviewWhereInput = {
    ...(status ? { status } : {}), ...(rating ? { rating: Number(rating) } : {}),
    ...(q ? { OR: [{ comment: { contains: q, mode: "insensitive" } }, { product: { name: { contains: q, mode: "insensitive" } } }, { user: { name: { contains: q, mode: "insensitive" } } }] } : {}),
  };
  const [count, counts] = await Promise.all([prisma.review.count({ where }), prisma.review.groupBy({ by: ["status"], _count: true })]);
  const paging = pagination(count, value(params, "page"), 20);
  const reviews = await prisma.review.findMany({ where, skip: paging.skip, take: paging.take,
    orderBy: [{ createdAt: choice(params, "sort", ["newest", "oldest"], "newest") === "oldest" ? "asc" : "desc" }, { id: "asc" }],
    include: { user: { select: { name: true } }, product: { select: { name: true, slug: true } } },
  });
  return <div className="space-y-6">
    <header><h1 className="font-serif text-3xl font-bold text-wine-900">Patron Reviews</h1><p className="mt-2 text-sm text-stone-600">Review customer feedback, approve it, then publish it. Only published reviews appear on Sudha Collections and count toward product ratings.</p></header>
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">{reviewStatuses.map(state => <Link key={state} href={`/admin/reviews?status=${state}`} className="rounded-xl border border-stone-200 bg-ivory-50 p-5"><p className="text-xs font-semibold text-stone-500">{state}</p><p className="mt-2 font-serif text-3xl text-wine-900">{counts.find(item => item.status === state)?._count ?? 0}</p></Link>)}</div>
    <ListControls path="/admin/reviews" params={params} search="Search product, customer or feedback" sorts={dateSorts} filters={[{ key: "status", label: "Status", options: options(reviewStatuses) }, { key: "rating", label: "Rating", options: [1, 2, 3, 4, 5].map(star => ({ value: String(star), label: `${star} / 5 stars` })) }]} />
    {!reviews.length && <p className="rounded-xl border border-stone-200 bg-ivory-50 p-8 text-center text-stone-500">No reviews match this view.</p>}
    <div className="space-y-4">{reviews.map(review => <article key={review.id} className="rounded-xl border border-stone-200 bg-ivory-50 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><Link href={`/products/${review.product.slug}#reviews`} className="font-semibold text-wine-900 underline">{review.product.name}</Link><p className="mt-1 text-sm text-stone-600">{review.user.name} · {review.createdAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })} IST</p><p className="mt-2 text-sm font-bold text-gold-600">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)} <span className="text-stone-600">{review.rating} / 5</span></p></div><span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-wine-900">{review.status}</span></div>
      {review.title && <h2 className="mt-4 break-words font-semibold text-wine-900">{review.title}</h2>}<p className="my-4 whitespace-pre-wrap break-words text-sm leading-6 text-stone-700">{review.comment}</p>
      <ReviewModerationControls id={review.id} status={review.status} />
    </article>)}</div>
    <Pagination path="/admin/reviews" params={params} {...paging} label="Reviews" />
  </div>;
}
