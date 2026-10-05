import Link from "next/link";
import { requireMessagingAdmin } from "@/lib/services/customer-messages.service";
import { TemplateEditor } from "../TemplateEditor";
export default async function NewTemplatePage() {
  try { await requireMessagingAdmin(); } catch { return <p role="alert">Only active administrators can manage customer messages.</p>; }
  return <div className="max-w-4xl mx-auto space-y-6"><Link href="/admin/homepage/templates" className="text-sm text-wine-800 underline">Back to Template Management</Link><h1 className="text-3xl font-serif text-wine-900">Create message template</h1><TemplateEditor /></div>;
}
