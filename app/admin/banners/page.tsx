import { ListControls } from "@/components/common/ListControls";
import { options, type ListPageProps } from "@/lib/listing";

import { SESSION_COOKIE_NAME } from "@/lib/session-config";
import React from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionToken } from "@/lib/auth";
import { getAllBanners, deleteBanner, toggleBannerStatus } from "@/app/actions/banner.actions";
import { Plus, Pencil, Trash2, Eye, EyeOff, ImageOff } from "lucide-react";

export default async function AdminBannersPage({ searchParams }: ListPageProps) {
  const sp = await searchParams;
  const cookieStore = await cookies();
  const token =
    cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionToken(token);

  if (!session || session.role === "CUSTOMER") {
    redirect("/login?callbackUrl=/admin/banners");
  }

  const banners = await getAllBanners(sp);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-wine-900">Homepage Hero Banners</h1>
          <p className="text-sm text-stone-500 mt-1">
            Manage the rotating banners shown at the top of the homepage.
          </p>
        </div>
        <Link
          href="/admin/banners/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 wine-gradient-bg text-gold-300 font-bold text-xs rounded uppercase tracking-wider gold-border shadow hover:brightness-110"
        >
          <Plus className="w-4 h-4" /> New Banner
        </Link>
      </div>

      <ListControls path="/admin/banners" params={sp} search="Banner title" sorts={[{ value: "display", label: "Display order" }, { value: "title", label: "Title: A?Z" }]} filters={[{ key: "status", label: "Status", options: options(["ACTIVE", "INACTIVE"]) }, { key: "placement", label: "Placement", options: options(["HERO", "PROMO"]) }]} />
      {banners.length === 0 ? (
        <div className="text-center py-16 bg-ivory-50 rounded-xl border border-stone-200 space-y-3">
          <ImageOff className="w-12 h-12 text-stone-300 mx-auto" />
          <p className="text-sm text-stone-500">No banners match this selection. Clear the filters or create a banner.</p>
        </div>
      ) : (
        <div className="bg-ivory-50 rounded-xl border border-stone-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-stone-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Preview</th>
                <th className="text-left px-4 py-3 font-semibold">Title</th>
                <th className="text-left px-4 py-3 font-semibold">Placement</th>
                <th className="text-left px-4 py-3 font-semibold">Order</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
                <th className="text-left px-4 py-3 font-semibold">Schedule</th>
                <th className="text-right px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {banners.map((banner) => (
                <tr key={banner.id} className="hover:bg-stone-50">
                  <td className="px-4 py-3">
                    <img
                      src={banner.desktopImage}
                      alt={banner.title}
                      className="w-24 h-14 object-cover rounded border border-stone-200"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-wine-900">{banner.title}</p>
                    {banner.subtitle && <p className="text-xs text-stone-500">{banner.subtitle}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-wine-50 text-wine-800 border border-wine-100">
                      {banner.placement}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-stone-600">{banner.displayOrder}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        banner.status === "ACTIVE"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-stone-100 text-stone-500"
                      }`}
                    >
                      {banner.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-stone-500">
                    {banner.startDate || banner.endDate ? (
                      <>
                        {banner.startDate ? new Date(banner.startDate).toLocaleDateString("en-IN") : "—"}
                        {" → "}
                        {banner.endDate ? new Date(banner.endDate).toLocaleDateString("en-IN") : "—"}
                      </>
                    ) : (
                      "Always shown"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <form action={async () => {
                        "use server";
                        await toggleBannerStatus(banner.id);
                      }}>
                        <button
                          type="submit"
                          title={banner.status === "ACTIVE" ? "Deactivate" : "Activate"}
                          className="p-2 rounded hover:bg-stone-100 text-stone-500"
                        >
                          {banner.status === "ACTIVE" ? (
                            <Eye className="w-4 h-4" />
                          ) : (
                            <EyeOff className="w-4 h-4" />
                          )}
                        </button>
                      </form>
                      <Link
                        href={`/admin/banners/${banner.id}`}
                        title="Edit"
                        className="p-2 rounded hover:bg-stone-100 text-stone-500"
                      >
                        <Pencil className="w-4 h-4" />
                      </Link>
                      <form action={async () => {
                        "use server";
                        await deleteBanner(banner.id);
                      }}>
                        <button
                          type="submit"
                          title="Delete"
                          className="p-2 rounded hover:bg-red-50 text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}