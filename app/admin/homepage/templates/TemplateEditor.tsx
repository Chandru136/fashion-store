"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { saveMessageTemplate, deleteMessageTemplate, findMessageCustomers, sendTemplateEmail } from "@/app/actions/message-template.actions";
import { messageTemplateSchema, renderCustomerMessage, customerWhatsAppUrl, type MessageCustomer, type MessageTemplateInput } from "@/lib/customer-messages";

const inputClass = "mt-1 w-full rounded border border-stone-300 bg-white p-2";
const buttonClass = "rounded border border-stone-300 px-4 py-2 text-sm disabled:opacity-50";
const blank: MessageTemplateInput = { name: "", subject: "News from {{store}}", body: "Hi {{name}},\n\nDiscover our latest collections at {{store}}.\n\nWith love,\nSudha Collections" };
export function TemplateEditor({ initial, emailConfigured = false }: { initial?: MessageTemplateInput & { id: string }; emailConfigured?: boolean }) {
  const router = useRouter();
  const [form, setForm] = useState<MessageTemplateInput>(initial || blank);
  const [saved, setSaved] = useState<MessageTemplateInput>(initial || blank);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [customers, setCustomers] = useState<MessageCustomer[]>([]);
  const [searched, setSearched] = useState(false);
  const [selected, setSelected] = useState<MessageCustomer[]>([]);
  const [results, setResults] = useState<{ customerId: string; name: string; status: string }[]>([]);
  const [reviewing, setReviewing] = useState(false);
  const [sending, setSending] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const requestId = useRef<string | null>(null);
  const dirty = form.name !== saved.name || form.subject !== saved.subject || form.body !== saved.body;
  const sampleName = selected[0]?.name || "Customer";
  const resetSend = () => { requestId.current = null; setResults([]); setReviewing(false); };
  return <div className="space-y-6">
    {notice && <p role="status" className="rounded border border-stone-200 bg-white p-3 text-sm">{notice}</p>}
    <form className="space-y-4 rounded-xl border border-stone-200 bg-ivory-50 p-6" onSubmit={async event => {
      event.preventDefault(); setBusy(true); setNotice("");
      try {
        const result = await saveMessageTemplate(initial?.id || null, form);
        if (!result.success) { setNotice(result.error); return; }
        const normalized = messageTemplateSchema.parse(form); setForm(normalized); setSaved(normalized); resetSend(); setNotice("Template saved.");
        if (!initial) router.push("/admin/homepage/templates/" + result.id); else router.refresh();
      } catch { setNotice("Unable to save template. Please try again."); } finally { setBusy(false); }
    }}>
      <fieldset disabled={busy || sending} className="space-y-4">
        <label className="block text-sm">Template name<input required maxLength={100} className={inputClass} value={form.name} onChange={event => { setForm({ ...form, name: event.target.value }); resetSend(); }} /></label>
        <label className="block text-sm">Email subject<input required maxLength={200} className={inputClass} value={form.subject} onChange={event => { setForm({ ...form, subject: event.target.value }); resetSend(); }} /></label>
        <label className="block text-sm">Common message for email and WhatsApp<textarea required maxLength={4000} rows={7} className={inputClass} value={form.body} onChange={event => { setForm({ ...form, body: event.target.value }); resetSend(); }} /></label>
        <p className="text-sm text-stone-500">Use <code>{"{{name}}"}</code> for the customer’s name and <code>{"{{store}}"}</code> for Sudha Collections. Messages use plain text.</p>
        <div className="flex gap-3"><button type="submit" className="rounded bg-wine-900 px-5 py-2 text-white">{busy ? "Saving…" : "Save template"}</button>{initial && <button type="button" className={buttonClass} onClick={() => setDeleteConfirm(true)}>Delete template</button>}</div>
      </fieldset>
      {deleteConfirm && <div className="rounded border border-red-200 p-3"><p className="mb-2 text-sm">Delete this saved template?</p><button type="button" disabled={busy || sending} className={buttonClass} onClick={async () => {
        if (!initial) return; setBusy(true);
        try { const result = await deleteMessageTemplate(initial.id); if (result.success) { router.push("/admin/homepage/templates"); router.refresh(); } else setNotice(result.error); }
        catch { setNotice("Unable to delete template."); } finally { setBusy(false); }
      }}>Delete</button> <button type="button" className={buttonClass} onClick={() => setDeleteConfirm(false)}>Cancel</button></div>}
    </form>
    <section className="rounded-xl border border-stone-200 bg-white p-6"><h2 className="text-xl font-serif text-wine-900">Message preview</h2><p className="mt-3 font-semibold">{renderCustomerMessage(form.subject, sampleName)}</p><p className="mt-3 whitespace-pre-wrap">{renderCustomerMessage(form.body, sampleName)}</p></section>
    {initial ? <section className="space-y-4 rounded-xl border border-stone-200 bg-white p-6">
      <h2 className="text-xl font-serif text-wine-900">Message customers</h2>
      <p className="text-sm text-stone-500">Select up to 50 active customers. Email is sent separately to each customer. WhatsApp opens a prepared message for you to send.</p>
      {dirty && <p className="text-sm text-amber-800">Save your changes before sending.</p>}
      <form className="flex gap-2" onSubmit={async event => {
        event.preventDefault(); setBusy(true); setNotice("");
        try { setCustomers(await findMessageCustomers(query)); setSearched(true); } catch { setNotice("Unable to load customers. Check your admin access and try again."); } finally { setBusy(false); }
      }}><input aria-label="Search customers" maxLength={100} className={inputClass} placeholder="Search customer name, email or phone" value={query} onChange={event => setQuery(event.target.value)} /><button disabled={busy || sending} className={buttonClass}>Search</button></form>
      <fieldset disabled={busy || sending} className="max-h-72 overflow-y-auto divide-y divide-stone-100">
        {customers.map(customer => <label key={customer.id} className="flex items-center gap-3 py-3 text-sm"><input type="checkbox" checked={selected.some(item => item.id === customer.id)} disabled={!selected.some(item => item.id === customer.id) && selected.length >= 50} onChange={event => { setSelected(old => event.target.checked ? [...old, customer] : old.filter(item => item.id !== customer.id)); resetSend(); }} /><span>{customer.name}<span className="block text-xs text-stone-500">{customer.email} · {customer.phone || "No phone"}</span></span></label>)}
      </fieldset>
      {searched && !customers.length && <p className="text-sm text-stone-500">No matching active customers.</p>}
      {customers.length === 50 && <p className="text-xs text-stone-500">Showing the first 50 matches. Refine your search to find more customers.</p>}
      <div className="flex items-center justify-between"><p className="text-sm font-semibold">{selected.length} customers selected</p><button className={buttonClass} disabled={sending || busy} onClick={() => { setSelected([]); resetSend(); }}>Clear selection</button></div>
      <div className="max-h-72 overflow-y-auto space-y-2">{selected.map(customer => {
        const url = customerWhatsAppUrl(customer.phone, renderCustomerMessage(saved.body, customer.name));
        return <div key={customer.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-stone-200 p-3 text-sm"><span>{customer.name} <span className="text-stone-500">({customer.email})</span></span>{url && !dirty && !sending && !busy ? <a href={url} target="_blank" rel="noopener noreferrer" className="font-semibold text-emerald-700 underline">Open WhatsApp</a> : <span className="text-stone-500">{!url ? "No valid WhatsApp number" : "Save changes or finish sending first"}</span>}<button type="button" disabled={sending || busy} aria-label={"Remove " + customer.name} className="text-stone-500 underline" onClick={() => { setSelected(old => old.filter(item => item.id !== customer.id)); resetSend(); }}>Remove</button></div>;
      })}</div>
      {!emailConfigured && <p className="text-sm text-amber-800">Email sending is unavailable until the server email account is configured.</p>}
      <button type="button" disabled={dirty || busy || sending || !selected.length || !emailConfigured} className="rounded bg-wine-900 px-5 py-2 text-white disabled:opacity-50" onClick={() => setReviewing(true)}>Review email</button>
      {reviewing && <div className="space-y-3 rounded border border-wine-200 bg-ivory-50 p-4"><p className="font-semibold">Send “{saved.subject}” to {selected.length} selected customers?</p><p className="text-sm">The preview above shows the message. Each customer receives their own name.</p><button type="button" disabled={sending || busy || dirty} className="rounded bg-wine-900 px-4 py-2 text-white disabled:opacity-50" onClick={async () => {
        setSending(true); setNotice(""); requestId.current ||= crypto.randomUUID();
        try {
          const result = await sendTemplateEmail({ templateId: initial.id, customerIds: selected.map(item => item.id), requestId: requestId.current, template: saved });
          if (result.success) { setResults(result.results); setReviewing(false); setNotice("Email request processed. Check the status for each customer below."); } else setNotice(result.error);
        } catch { setNotice("Request interrupted. Retry with the same selection to check its status without sending duplicates."); }
        finally { setSending(false); }
      }}>{sending ? "Sending…" : "Send email"}</button> <button type="button" disabled={sending} className={buttonClass} onClick={() => setReviewing(false)}>Cancel</button></div>}
      {results.length > 0 && <div role="status" className="space-y-2 text-sm"><h3 className="font-semibold">Email results</h3>{results.map(result => <p key={result.customerId}>{result.name}: {result.status === "ACCEPTED" ? "Accepted by email server" : result.status === "FAILED" ? "Failed to send" : "Processing / delivery status unconfirmed"}</p>)}<p className="text-xs text-stone-500">Server acceptance does not confirm inbox delivery. Repeating this request does not resend messages.</p>{results.some(result => result.status === "FAILED") && <button type="button" disabled={sending || busy} className={buttonClass} onClick={() => { const failed = new Set(results.filter(result => result.status === "FAILED").map(result => result.customerId)); setSelected(old => old.filter(customer => failed.has(customer.id))); resetSend(); }}>Prepare a new request for failed recipients</button>}</div>}
    </section> : <p className="text-sm text-stone-500">Save the template to select customers and send messages.</p>}
  </div>;
}
