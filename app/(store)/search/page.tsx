import ProductListingPage from "@/app/(store)/products/page";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const sp = await searchParams;
  return <ProductListingPage searchParams={Promise.resolve(sp)} />;
}
