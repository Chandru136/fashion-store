import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireMessagingAdmin } from "@/lib/services/customer-messages.service";

export const metadata = { title: "Template Management | Sudha Collections" };
export default async function TemplateManagementPage() {
  try { await requireMessagingAdmin(); } catch { return <p role="alert">Only active administrators can manage customer messages.</p>; }
  const templates = await prisma.messageTemplate.findMany({ orderBy: { updatedAt: "desc" } });
  return <div className="max-w-5xl mx-auto space-y-6">
    <Link href="/admin/homepage" className="text-sm text-wine-800 underline">Back to Homepage CMS</Link>
    <div className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-3xl font-serif text-wine-900">Template Management</h1><p className="mt-2 text-stone-600">Reusable Sudha Collections messages for WhatsApp and email.</p></div><Link href="/admin/homepage/templates/new" className="rounded bg-wine-900 px-5 py-3 text-white">Create template</Link></div>
    <div className="grid gap-4 md:grid-cols-2">{templates.map(template => <Link href={"/admin/homepage/templates/" + template.id} key={template.id} className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm hover:border-wine-800"><h2 className="text-xl font-serif text-wine-900">{template.name}</h2><p className="mt-2 text-sm text-stone-600 line-clamp-2">{template.subject}</p><span className="mt-4 block text-sm font-semibold text-wine-800">Edit template & message customers →</span></Link>)}</div>
    {!templates.length && <p className="rounded-xl border border-dashed border-stone-300 p-8 text-center text-stone-500">No templates yet. Create your first customer message.</p>}
  </div>;
}
