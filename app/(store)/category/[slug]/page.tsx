import ProductListingPage from "@/app/(store)/products/page";

export default async function CategoryPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<any> }) {
  const p = await params;
  const sp = await searchParams;

  return <ProductListingPage searchParams={Promise.resolve({ ...sp, category: p.slug })} />;
}
