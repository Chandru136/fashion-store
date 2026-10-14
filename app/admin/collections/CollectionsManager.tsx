"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Collection } from "@prisma/client";
import { ArrowUpRight, Layers, Plus, Search, Sparkles } from "lucide-react";
import { saveCollection, deleteCollection } from "@/app/actions/collection.actions";
import { collectionIdeas, collectionImage, type CollectionInput } from "@/lib/validations/collection";

const empty: CollectionInput = { name: "", slug: "", description: "", image: "", mobileImage: "", buttonText: "Explore the edit", buttonUrl: "/products", status: "INACTIVE", displayOrder: 0 };
const inputClass = "mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-gold-500";
const buttonClass = "rounded-lg bg-wine-900 px-4 py-2.5 text-sm font-semibold text-ivory-50 disabled:opacity-50";

export function CollectionsManager({ collections, categories }: { collections: Collection[]; categories: { name: string; slug: string }[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [editor, setEditor] = useState<{ id: string | null; form: CollectionInput } | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const active = collections.filter(item => item.status === "ACTIVE");
  const visible = collections.filter(item => (status === "ALL" || item.status === status) && `${item.name} ${item.description} ${item.slug}`.toLowerCase().includes(query.toLowerCase()));
  const form = editor?.form;

  function open(item?: Collection | typeof collectionIdeas[number]) {
    setMessage(""); setError(""); setDeleting(null);
    setEditor({ id: item && "id" in item ? item.id : null, form: { ...empty, displayOrder: Math.min(2147483647, Math.max(0, ...collections.map(row => row.displayOrder)) + 1), ...item, description: item?.description || "", mobileImage: item && "mobileImage" in item ? item.mobileImage || "" : "", buttonText: item && "buttonText" in item ? item.buttonText || "Explore the edit" : "Explore the edit", status: item && "status" in item && item.status === "ACTIVE" ? "ACTIVE" : "INACTIVE" } });
  }
  function update<K extends keyof CollectionInput>(key: K, value: CollectionInput[K]) {
    setEditor(previous => previous && ({ ...previous, form: { ...previous.form, [key]: value } }));
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!editor) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const result = await saveCollection(editor.id, editor.form);
      if (!result.success) { setError(result.error || "Unable to save."); return; }
      setEditor(null); setMessage("Collection saved. Your storefront has been updated."); router.refresh();
    } catch { setError("Unable to save. Please try again."); } finally { setBusy(false); }
  }
  async function remove(id: string) {
    setBusy(true); setError(""); setMessage("");
    try {
      const result = await deleteCollection(id);
      if (!result.success) { setError(result.error || "Unable to delete."); return; }
      setDeleting(null); setMessage("Collection deleted. Products have been kept."); router.refresh();
    } catch { setError("Unable to delete. Please try again."); } finally { setBusy(false); }
  }
  async function upload(file: File | undefined, field: "image" | "mobileImage") {
    if (!file) return;
    setBusy(true); setError("");
    try {
      const body = new FormData(); body.append("image", file);
      const response = await fetch("/api/admin/collection-images", { method: "POST", body });
      const result = await response.json();
      if (!response.ok || !result.url) throw new Error(result.error || "Upload failed.");
      update(field, result.url);
    } catch (err) { setError(err instanceof Error ? err.message : "Upload failed."); } finally { setBusy(false); }
  }

  return <div className="mx-auto max-w-7xl space-y-7 text-stone-700">
    <header className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-wine-800">Sudha Collections · Storefront curation</p><h1 className="mt-2 font-serif text-3xl text-wine-900">Editorial Collections</h1><p className="mt-2 max-w-2xl text-sm leading-6">Bring products together through a story, an occasion or a fabric. Create an inviting cover and send shoppers to the right selection.</p></div><div className="flex items-center gap-3"><Link href="/" target="_blank" className="text-sm underline">View storefront ↗</Link>{!editor && <button onClick={() => open()} className={`${buttonClass} flex items-center gap-2`}><Plus size={17} />New collection</button>}</div></header>
    <div className="grid gap-4 sm:grid-cols-3">{[{ label: "Total collections", count: collections.length }, { label: "Active collections", count: active.length }, { label: "Drafts / hidden", count: collections.length - active.length }].map(stat => <div key={stat.label} className="rounded-xl border border-stone-200 bg-ivory-50 p-5"><p className="text-xs uppercase tracking-wider">{stat.label}</p><p className="mt-2 font-serif text-3xl text-wine-900">{stat.count}</p></div>)}</div>
    <div className="rounded-xl border border-gold-500/30 bg-ivory-100 p-5 text-sm leading-6"><strong className="text-wine-900">Where these appear</strong><p>The homepage’s “Our world of beautiful weaves” section shows the first six active collections, lowest display order first. If none are active, the existing inspiration cards remain visible.</p><p className="mt-1">Use <Link href="/admin/homepage" className="underline text-wine-800">Homepage CMS</Link> for the separate story and heritage sections. Collections link to categories or filtered products; they do not change your inventory.</p></div>
    {message && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{message}</p>}
    {error && <p role="alert" className="whitespace-pre-line rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
    {editor && form ? <section className="rounded-2xl border border-stone-200 bg-ivory-50 p-5 sm:p-7">
      <h2 className="mb-6 font-serif text-2xl text-wine-900">{editor.id ? "Edit collection" : "Create a collection"}</h2>
      <form onSubmit={submit}><fieldset disabled={busy} className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">Collection name<input required maxLength={100} className={inputClass} value={form.name} onChange={event => { const name = event.target.value; setEditor(previous => previous && ({ ...previous, form: { ...previous.form, name, slug: !previous.id && previous.form.slug === previous.form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") ? name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") : previous.form.slug } })); }} placeholder="The Bridal Edit" /></label><label className="text-sm font-medium">Unique slug<input required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={100} className={inputClass} value={form.slug} onChange={event => update("slug", event.target.value)} placeholder="bridal-edit" /><span className="mt-1 block text-xs font-normal text-stone-500">An internal identifier, not a new shopping page.</span></label></div>
          <label className="block text-sm font-medium">Short story<textarea rows={3} maxLength={300} className={inputClass} value={form.description} onChange={event => update("description", event.target.value)} placeholder="A sentence about the mood, occasion or weave." /><span className="block text-right text-xs font-normal text-stone-500">{form.description.length}/300</span></label>
          {(["image", "mobileImage"] as const).map(field => <div key={field}><label className="block text-sm font-medium">{field === "image" ? "Cover image" : "Mobile cover image (optional)"}<input required={field === "image"} className={inputClass} value={form[field]} onChange={event => update(field, event.target.value)} placeholder="/images/home/silk-story.jpg or https://…" /></label><label className="mt-2 block text-xs">Or upload an image<input aria-label={`Upload ${field === "image" ? "cover" : "mobile cover"} image`} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" className="mt-2 block w-full text-xs file:mr-3 file:rounded file:border file:border-stone-300 file:bg-white file:p-2" onChange={event => void upload(event.target.files?.[0], field)} /></label><p className="mt-2 text-xs text-stone-500">Portrait images work best. JPG, PNG, WebP, GIF or AVIF, up to 5 MB.{field === "mobileImage" && " Leave blank to use the main cover."}</p></div>)}
          <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">Button text<input required maxLength={40} className={inputClass} value={form.buttonText} onChange={event => update("buttonText", event.target.value)} /></label><label className="text-sm font-medium">Choose a shopping destination<select className={inputClass} value="" onChange={event => { if (event.target.value) update("buttonUrl", event.target.value); }}><option value="">Choose a shortcut…</option><option value="/products">All products</option><option value="/products?sort=newest">Newest products first</option>{categories.map(category => <option key={category.slug} value={`/category/${category.slug}`}>{category.name}</option>)}</select></label></div>
          <label className="block text-sm font-medium">Shopping destination<input required className={inputClass} value={form.buttonUrl} onChange={event => update("buttonUrl", event.target.value)} /><span className="mt-2 block text-xs font-normal text-stone-500">Paste a category or filtered /products URL from your store. Check that it contains suitable products before publishing.</span></label>
          <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">Visibility<select className={inputClass} value={form.status} onChange={event => update("status", event.target.value as CollectionInput["status"])}><option value="INACTIVE">Draft / hidden</option><option value="ACTIVE">Active / published</option></select></label><label className="text-sm font-medium">Display order<input type="number" required min={0} max={2147483647} step={1} className={inputClass} value={Number.isNaN(form.displayOrder) ? "" : form.displayOrder} onChange={event => update("displayOrder", event.target.value === "" ? NaN : Number(event.target.value))} /><span className="mt-1 block text-xs font-normal text-stone-500">Lower numbers appear first.</span></label></div>
          <div className="flex gap-3"><button type="submit" className={buttonClass}>{busy ? "Saving…" : "Save collection"}</button><button type="button" className="rounded-lg border border-stone-300 px-4 py-2 text-sm" onClick={() => { setEditor(null); setError(""); }}>Cancel</button></div>
        </div>
        <aside><p className="mb-3 text-xs font-semibold uppercase tracking-widest">Cover preview</p><div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-wine-900 text-ivory-50">{collectionImage.safeParse(form.image).success && <img key={form.image} src={form.image} alt={form.name || "Collection cover"} className="h-full w-full object-cover" />}<div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/90 via-black/10 to-transparent p-6"><p className="text-xs uppercase tracking-widest text-gold-300">Sudha Collections</p><h3 className="mt-2 break-words font-serif text-3xl">{form.name || "Your collection story"}</h3><p className="mt-2 text-sm">{form.description}</p><span className="mt-4 flex items-center gap-2 text-sm">{form.buttonText}<ArrowUpRight size={16} /></span></div></div><p className="mt-3 text-xs leading-5 text-stone-500">Preview of the main cover. Review your crop on the storefront after saving.</p>{/^\/products(?:\?|$)|^\/category\/[a-z0-9-]+(?:\?|$)/.test(form.buttonUrl) && <a className="mt-4 inline-block text-sm text-wine-800 underline" href={form.buttonUrl} target="_blank" rel="noreferrer">Check shopping destination ↗</a>}</aside>
      </fieldset></form>
    </section> : <>
      <section><div className="mb-4 flex items-center gap-2"><Sparkles size={19} className="text-wine-800" /><h2 className="font-serif text-xl text-wine-900">A little inspiration to get started</h2></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{collectionIdeas.map(idea => <button key={idea.slug} onClick={() => open(idea)} className="rounded-xl border border-stone-200 bg-ivory-50 p-4 text-left transition hover:border-gold-500"><span className="font-serif text-lg text-wine-900">{idea.name}</span><span className="mt-2 block text-xs leading-5">{idea.description}</span><span className="mt-3 block text-xs font-semibold text-wine-800">Use this idea +</span></button>)}</div><p className="mt-2 text-xs text-stone-500">Ideas open as unsaved drafts. Replace inspiration images with your own collection photography.</p></section>
      <section className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-serif text-2xl text-wine-900">Your collections <span className="text-base text-stone-500">({visible.length})</span></h2><div className="flex flex-wrap gap-3"><label className="flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-3"><Search size={16} /><input aria-label="Search collections" value={query} onChange={event => setQuery(event.target.value)} className="w-44 py-2 text-sm outline-none" placeholder="Search collections…" /></label><select aria-label="Filter by visibility" value={status} onChange={event => setStatus(event.target.value)} className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"><option value="ALL">All statuses</option><option value="ACTIVE">Active</option><option value="INACTIVE">Draft / hidden</option></select></div></div>
        {!visible.length && <div className="rounded-xl border border-dashed border-stone-300 bg-ivory-50 p-12 text-center"><Layers className="mx-auto mb-3 text-wine-800" size={32} /><h3 className="font-serif text-xl text-wine-900">{collections.length ? "No collections match" : "Your next collection starts with a story"}</h3><p className="mt-2 text-sm">{collections.length ? "Try another search or visibility filter." : "Choose an idea above or create your first collection."}</p></div>}
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{visible.map(item => <article key={item.id} className="overflow-hidden rounded-xl border border-stone-200 bg-ivory-50"><div className="relative h-56 bg-stone-200"><img src={item.image} alt={item.name} className="h-full w-full object-cover" /><span className="absolute left-3 top-3 rounded-full bg-ivory-50 px-3 py-1 text-xs font-semibold text-wine-900">{item.status === "ACTIVE" ? active.findIndex(row => row.id === item.id) < 6 ? "Live on homepage" : "Active · outside first 6" : "Draft / hidden"}</span></div><div className="space-y-3 p-5"><div className="flex items-start justify-between gap-3"><h3 className="font-serif text-xl text-wine-900">{item.name}</h3><span className="shrink-0 text-xs text-stone-500">Order {item.displayOrder}</span></div><p className="line-clamp-2 min-h-10 text-sm text-stone-600">{item.description || "Add a short story to introduce this collection."}</p><a href={item.buttonUrl} target="_blank" rel="noreferrer" className="block truncate text-xs text-wine-800 underline">{item.buttonText || "Explore the edit"} ↗ {item.buttonUrl}</a><div className="flex gap-3 border-t border-stone-200 pt-3"><button className={`${buttonClass} flex-1`} onClick={() => open(item)}>Edit collection</button><button className="px-2 text-sm text-red-800" onClick={() => { setDeleting(item.id); setError(""); }}>Delete</button></div>{deleting === item.id && <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-900"><p>Delete “{item.name}”? This removes its homepage card. Products will be kept.</p><div className="mt-3 flex gap-4"><button disabled={busy} onClick={() => void remove(item.id)} className="font-semibold underline">{busy ? "Deleting…" : "Confirm delete"}</button><button disabled={busy} onClick={() => setDeleting(null)}>Cancel</button></div></div>}</div></article>)}</div>
      </section>
    </>}
  </div>;
}
