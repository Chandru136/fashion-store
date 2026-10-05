"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveHomepageContent } from "@/app/actions/homepage.actions";
import { defaultHomepageContent, defaultStoryCards, type HomepageContent } from "@/lib/homepage-content";

type Value = string | boolean | Value[] | { [key: string]: Value };
const labels: Record<string, string> = {
  eyebrow: "Small heading", title: "Heading", emphasis: "Italic heading text", description: "Description",
  cards: "Cards", name: "Name", subtitle: "Subtitle", image: "Image URL or uploaded image path", href: "Link URL",
  detail: "Use close-up image crop", label: "Label", featuredBadge: "Badge (optional)",
  categories: "Category links", priceRanges: "Price links", brands: "Brand links", banner: "Menu promotional card",
  buttonText: "Button text", buttonUrl: "Button link", id: "Unique menu ID",
};
const buttonClass = "rounded border border-stone-300 px-3 py-1.5 text-sm hover:bg-stone-100 disabled:opacity-40";

function blankItem(key: string): Value {
  if (key === "navigation") return { ...structuredClone(defaultHomepageContent.navigation[0]), id: `SC-menu-${crypto.randomUUID()}`, label: "New menu", href: "/products", featuredBadge: "", categories: [], priceRanges: [], brands: [] };
  if (key === "cards") return { ...defaultStoryCards[0], name: "New story" };
  if (key === "priceRanges") return { label: "New price link", href: "/products" };
  return { name: "New link", href: "/products" };
}

function Editor({ value, onChange, field, path }: { value: Value; onChange: (value: Value) => void; field: string; path: string }) {
  if (typeof value === "boolean") return <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={value} onChange={event => onChange(event.target.checked)} />{labels[field] || field}</label>;
  if (typeof value === "string") return <label className="block text-sm text-stone-700">{labels[field] || field}
    {field === "description" ? <textarea className="mt-1 w-full rounded border border-stone-300 bg-white p-2" rows={3} value={value} onChange={event => onChange(event.target.value)} /> : <input className="mt-1 w-full rounded border border-stone-300 bg-white p-2" value={value} onChange={event => onChange(event.target.value)} />}
  </label>;
  if (Array.isArray(value)) {
    const limit = field === "navigation" ? 12 : field === "cards" ? 8 : 30;
    return <div className="space-y-3"><h3 className="font-semibold">{labels[field] || "Navigation menus"}</h3>
      {value.map((item, index) => {
        const object = item as Record<string, Value>;
        const name = String(object.label || object.name || `Item ${index + 1}`);
        const move = (direction: number) => { const next = [...value]; [next[index], next[index + direction]] = [next[index + direction], next[index]]; onChange(next); };
        return <details key={`${path}-${index}`} className="rounded border border-stone-200 bg-white p-4"><summary className="cursor-pointer font-medium">{index + 1}. {name}</summary>
          <div className="mt-4 space-y-4"><div className="flex flex-wrap gap-2">
            <button type="button" className={buttonClass} disabled={index === 0} onClick={() => move(-1)} aria-label={`Move ${name} up`}>Move up</button>
            <button type="button" className={buttonClass} disabled={index === value.length - 1} onClick={() => move(1)} aria-label={`Move ${name} down`}>Move down</button>
            <button type="button" className={buttonClass} onClick={() => onChange(value.filter((_, position) => position !== index))} aria-label={`Remove ${name}`}>Remove</button>
          </div><Editor value={item} field={field} path={`${path}.${index}`} onChange={next => onChange(value.map((old, position) => position === index ? next : old))} /></div>
        </details>;
      })}
      <button type="button" className={buttonClass} disabled={value.length >= limit} onClick={() => onChange([...value, blankItem(field)])}>Add {field === "navigation" ? "menu" : field === "cards" ? "card" : "link"}</button>
    </div>;
  }
  return <div className="space-y-4">{Object.entries(value).map(([key, item]) => <div key={key}>
    {typeof item === "object" && !Array.isArray(item) && <h3 className="mb-2 font-semibold">{labels[key] || key}</h3>}
    <Editor value={item} field={key} path={`${path}.${key}`} onChange={next => onChange({ ...value, [key]: next })} />
  </div>)}</div>;
}

export function HomepageForm({ initialContent, section }: { initialContent: HomepageContent[keyof HomepageContent]; section: keyof HomepageContent }) {
  const [content, setContent] = useState<Value>(initialContent);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const router = useRouter();
  return <form onSubmit={async event => {
    event.preventDefault(); setSaving(true); setMessage("");
    try {
      const result = await saveHomepageContent(section, content);
      setFailed(!result.success); setMessage(result.success ? "Section changes saved and published." : result.error || "Unable to save.");
      if (result.success) router.refresh();
    } catch { setFailed(true); setMessage("Unable to save changes. Please try again."); }
    finally { setSaving(false); }
  }} className="space-y-6">
    <fieldset disabled={saving} className="space-y-6">
      <section className="rounded-xl border border-stone-200 bg-ivory-50 p-6 shadow-sm">
        {section === "navigation" && <p className="mb-4 text-sm text-stone-500">These menus appear on desktop and mobile. Expand a menu to edit its links and promotional card.</p>}
        <Editor value={content} field={section} path={section} onChange={next => { setContent(next); setMessage(""); }} />
      </section>
    </fieldset>
    <div className="sticky bottom-0 rounded-lg border border-stone-200 bg-white p-4 shadow-lg">
      {message && <p role={failed ? "alert" : "status"} className={`mb-3 whitespace-pre-line text-sm ${failed ? "text-red-700" : "text-emerald-700"}`}>{message}</p>}
      <button type="submit" disabled={saving} className="rounded bg-wine-900 px-6 py-3 font-semibold text-white disabled:opacity-50">{saving ? "Saving…" : "Save section changes"}</button>
    </div>
  </form>;
}
