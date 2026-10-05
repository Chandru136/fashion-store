import { z } from "zod";

const messageText = z.string().trim().min(1, "Message is required").max(4000).refine(
  value => !/\{\{(?!name\}\}|store\}\})[^}]*\}\}/.test(value),
  "Supported placeholders are {{name}} and {{store}}",
);
export const messageTemplateSchema = z.object({
  name: z.string().trim().min(1, "Template name is required").max(100),
  subject: messageText.refine(value => value.length <= 200 && !/[\r\n]/.test(value), "Subject must be one line, up to 200 characters"),
  body: messageText,
});
export type MessageTemplateInput = z.infer<typeof messageTemplateSchema>;
export type MessageCustomer = { id: string; name: string; email: string; phone: string | null };
export function renderCustomerMessage(text: string, name: string) {
  return text.replace(/\{\{(name|store)\}\}/g, (_, token) => token === "name" ? name || "Customer" : "Sudha Collections");
}
export function messageEmailHtml(body: string) {
  const escaped = body.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]!));
  return `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;color:#292524"><h2>Sudha Collections</h2><div style="white-space:pre-wrap;line-height:1.7">${escaped}</div></div>`;
}
export function customerWhatsAppUrl(phone: string | null, text: string): string | null {
  const compact = (phone || "").trim().replace(/[\s().-]/g, "");
  const international = /^(\+|00)/.test(compact);
  let number = compact.replace(/^(\+|00)/, "");
  if (!international) {
    if (/^0[6-9]\d{9}$/.test(number)) number = number.slice(1);
    if (/^[6-9]\d{9}$/.test(number)) number = `91${number}`;
  }
  if (!/^[1-9]\d{7,14}$/.test(number) || (!international && !/^91[6-9]\d{9}$/.test(number))) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}
