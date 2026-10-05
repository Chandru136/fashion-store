"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireMessagingAdmin } from "@/lib/services/customer-messages.service";
import { messageTemplateSchema, renderCustomerMessage, messageEmailHtml } from "@/lib/customer-messages";

export async function saveMessageTemplate(id: string | null, input: unknown) {
  try {
    await requireMessagingAdmin();
    const parsed = messageTemplateSchema.safeParse(input);
    if (!parsed.success) return { success: false as const, error: parsed.error.issues.map(issue => issue.message).join(". ") };
    const template = id ? await prisma.messageTemplate.update({ where: { id }, data: parsed.data }) : await prisma.messageTemplate.create({ data: parsed.data });
    revalidatePath("/admin/homepage/templates", "layout");
    return { success: true as const, id: template.id };
  } catch { return { success: false as const, error: "Unable to save template. Check your admin access and try again." }; }
}

export async function deleteMessageTemplate(id: string) {
  try {
    await requireMessagingAdmin();
    await prisma.messageTemplate.delete({ where: { id } });
    revalidatePath("/admin/homepage/templates", "layout");
    return { success: true as const };
  } catch { return { success: false as const, error: "Unable to delete template." }; }
}

export async function findMessageCustomers(query: string) {
  await requireMessagingAdmin();
  const q = z.string().trim().max(100).parse(query);
  const customers = await prisma.user.findMany({
    where: { role: "CUSTOMER", status: "ACTIVE", ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" as const } }, { email: { contains: q, mode: "insensitive" as const } }, { phone: { contains: q } }] } : {}) },
    orderBy: [{ name: "asc" }, { id: "asc" }], take: 50,
    select: { id: true, name: true, email: true, phone: true, addresses: { orderBy: [{ isDefault: "desc" }, { id: "asc" }], take: 1, select: { phone: true } } },
  });
  return customers.map(({ addresses, ...customer }) => ({ ...customer, phone: customer.phone || addresses[0]?.phone || null }));
}

const sendSchema = z.object({ templateId: z.string().min(1), customerIds: z.array(z.string().min(1)).min(1).max(50), requestId: z.string().uuid(), template: messageTemplateSchema });
export async function sendTemplateEmail(input: unknown) {
  try {
    const actor = await requireMessagingAdmin();
    const parsed = sendSchema.safeParse(input);
    if (!parsed.success) return { success: false as const, error: "Choose between 1 and 50 customers." };
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) return { success: false as const, error: "Email is not configured. Set SMTP_USER and SMTP_PASSWORD on the server." };
    const { templateId, requestId } = parsed.data;
    const ids = [...new Set(parsed.data.customerIds)];
    const [template, customers] = await Promise.all([
      prisma.messageTemplate.findUnique({ where: { id: templateId } }),
      prisma.user.findMany({ where: { id: { in: ids }, role: "CUSTOMER", status: "ACTIVE" }, select: { id: true, name: true, email: true } }),
    ]);
    if (!template) return { success: false as const, error: "Template no longer exists." };
    if (template.subject !== parsed.data.template.subject || template.body !== parsed.data.template.body) return { success: false as const, error: "This template changed since your preview. Reload the page and review it again." };
    if (customers.length !== ids.length) return { success: false as const, error: "Some selected customers are no longer active. Refresh the customer list." };
    const { sendEmail } = await import("@/lib/mailer");
    const results: { customerId: string; name: string; status: string }[] = [];
    for (const customer of customers) {
      // A request can submit each recipient once, including when the browser retries.
      const claimed = await prisma.customerMessageDelivery.createMany({ data: [{ requestId, customerId: customer.id, templateId, actorId: actor.id }], skipDuplicates: true });
      if (!claimed.count) {
        const existing = await prisma.customerMessageDelivery.findUnique({ where: { requestId_customerId: { requestId, customerId: customer.id } } });
        results.push({ customerId: customer.id, name: customer.name, status: existing?.status || "SENDING" });
        continue;
      }
      const accepted = await sendEmail({ to: customer.email, subject: renderCustomerMessage(template.subject, customer.name).replace(/[\r\n]+/g, " "), html: messageEmailHtml(renderCustomerMessage(template.body, customer.name)) });
      const status = accepted ? "ACCEPTED" : "FAILED";
      await prisma.customerMessageDelivery.update({ where: { requestId_customerId: { requestId, customerId: customer.id } }, data: { status } });
      results.push({ customerId: customer.id, name: customer.name, status });
    }
    return { success: true as const, results };
  } catch { return { success: false as const, error: "Unable to complete the send request. Retry with the same selection to check its status without sending duplicates." }; }
}
