import { ProductListing } from "@/components/product/ProductListing";
import type { ListPageProps } from "@/lib/listing";
export default async function Page({ searchParams }: ListPageProps) {
 return <ProductListing params={await searchParams} path="/search" />;
}
