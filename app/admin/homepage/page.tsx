import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { homepageSections } from "@/lib/homepage-sections";
export default function HomepageCMSPage() {
  return <div className="max-w-5xl mx-auto space-y-6">
    <div><h1 className="text-3xl font-serif text-wine-900">Homepage CMS</h1><p className="mt-2 text-stone-600">Choose a section of the Sudha Collections homepage to update.</p></div>
    <div className="grid gap-4 md:grid-cols-2">
      {homepageSections.map(section => <Link key={section.key} href={"/admin/homepage/" + section.slug} className="rounded-xl border border-stone-200 bg-ivory-50 p-6 shadow-sm transition hover:border-wine-800 hover:shadow-md">
        <h2 className="text-xl font-serif text-wine-900">{section.title}</h2>
        <p className="mt-2 text-sm text-stone-600">{section.description}</p>
        <span className="mt-5 flex items-center gap-2 text-sm font-semibold text-wine-800">Edit section <ArrowRight size={16} /></span>
      </Link>)}
      <Link href="/admin/homepage/templates" className="rounded-xl border border-stone-200 bg-ivory-50 p-6 shadow-sm transition hover:border-wine-800 hover:shadow-md">
        <h2 className="text-xl font-serif text-wine-900">Template Management</h2>
        <p className="mt-2 text-sm text-stone-600">Create reusable customer messages for WhatsApp and email.</p>
        <span className="mt-5 flex items-center gap-2 text-sm font-semibold text-wine-800">Manage templates <ArrowRight size={16} /></span>
      </Link>
    </div>
    <Link className="inline-flex items-center gap-2 text-wine-800 underline" href="/admin/banners">Manage hero and promotional banners <ArrowRight size={16} /></Link>
  </div>;
}
