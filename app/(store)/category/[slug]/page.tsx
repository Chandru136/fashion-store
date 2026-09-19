import { ProductListing } from "@/components/product/ProductListing";
import type { ListPageProps } from "@/lib/listing";
export default async function CategoryPage({ params, searchParams }: ListPageProps & { params: Promise<{ slug: string }> }) {
 const { slug } = await params;
 return <ProductListing params={{ ...await searchParams, category: slug }} path={"/category/" + encodeURIComponent(slug)} />;
}
