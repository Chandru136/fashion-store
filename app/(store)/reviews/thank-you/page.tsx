import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/db";
import { getReviewSession } from "@/lib/review-session";
import { value, type ListPageProps } from "@/lib/listing";

export const metadata = { title: "Thank you for your feedback | Sudha Collections", robots: { index: false, follow: false } };

export default async function ReviewThankYouPage({ searchParams }: ListPageProps) {
  const actor = await getReviewSession();
  if (!actor) redirect("/login");
  const id = value(await searchParams, "id");
  const review = await prisma.review.findFirst({ where: { id, userId: actor.id }, select: { product: { select: { slug: true, name: true } } } });
  if (!review) notFound();
  return <main className="mx-auto max-w-2xl px-4 py-20 text-center">
    <CheckCircle2 aria-hidden="true" className="mx-auto mb-6 h-14 w-14 text-emerald-700" />
    <h1 className="font-serif text-3xl text-wine-900">Thank you for your feedback!</h1>
    <p className="mt-5 leading-7 text-stone-600">We have received your review of <strong>{review.product.name}</strong>. Reviews appear on Sudha Collections after our team approves and publishes them.</p>
    <div className="mt-8 flex flex-wrap justify-center gap-4"><Link className="rounded-lg wine-gradient-bg px-6 py-3 font-semibold text-gold-300" href={`/products/${review.product.slug}#reviews`}>Back to product</Link><Link href="/products" className="rounded-lg border border-stone-300 px-6 py-3 text-wine-900">Continue shopping</Link></div>
  </main>;
}
