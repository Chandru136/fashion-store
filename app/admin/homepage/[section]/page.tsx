import Link from "next/link";
import { notFound } from "next/navigation";
import { homepageSections } from "@/lib/homepage-sections";
import { getHomepageContent } from "@/lib/services/homepage-content.service";
import { HomepageForm } from "../HomepageForm";
export default async function HomepageSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section: slug } = await params;
  const section = homepageSections.find(item => item.slug === slug);
  if (!section) notFound();
  const content = await getHomepageContent();
  return <div className="max-w-4xl mx-auto space-y-6">
    <Link href="/admin/homepage" className="text-sm text-wine-800 underline">Back to Homepage CMS</Link>
    <div><h1 className="text-3xl font-serif text-wine-900">{section.title}</h1><p className="mt-2 text-stone-600">{section.description} Changes go live when you save.</p></div>
    <HomepageForm key={section.key} section={section.key} initialContent={content[section.key]} />
  </div>;
}
