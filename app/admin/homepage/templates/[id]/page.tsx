import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireMessagingAdmin } from "@/lib/services/customer-messages.service";
import { TemplateEditor } from "../TemplateEditor";
export default async function EditTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  try { await requireMessagingAdmin(); } catch { return <p role="alert">Only active administrators can manage customer messages.</p>; }
  const { id } = await params;
  const template = await prisma.messageTemplate.findUnique({ where: { id } });
  if (!template) notFound();
  return <div className="max-w-4xl mx-auto space-y-6"><Link href="/admin/homepage/templates" className="text-sm text-wine-800 underline">Back to Template Management</Link><h1 className="text-3xl font-serif text-wine-900">{template.name}</h1><TemplateEditor initial={{ id: template.id, name: template.name, subject: template.subject, body: template.body }} emailConfigured={Boolean(process.env.SMTP_USER && process.env.SMTP_PASSWORD)} /></div>;
}
