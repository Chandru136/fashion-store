import React from "react";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifySessionToken } from "@/lib/auth";
import { getBanner } from "@/app/actions/banner.actions";
import BannerForm from "../BannerForm";

export default async function EditBannerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const cookieStore = await cookies();
  const token = cookieStore.get("aarna_session_user")?.value;
  const session = await verifySessionToken(token);

  if (!session || session.role === "CUSTOMER") {
    redirect(`/login?callbackUrl=/admin/banners/${id}`);
  }

  const banner = await getBanner(id);

  if (!banner) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-wine-900">Edit Hero Banner</h1>
        <p className="text-sm text-stone-500 mt-1">{banner.title}</p>
      </div>

      <BannerForm
        bannerId={banner.id}
        initialData={{
          title: banner.title,
          subtitle: banner.subtitle || undefined,
          desktopImage: banner.desktopImage,
          mobileImage: banner.mobileImage || undefined,
          buttonText: banner.buttonText || undefined,
          buttonUrl: banner.buttonUrl || undefined,
          startDate: banner.startDate ? banner.startDate.toISOString() : undefined,
          endDate: banner.endDate ? banner.endDate.toISOString() : undefined,
          status: banner.status as "ACTIVE" | "INACTIVE",
          displayOrder: banner.displayOrder,
        }}
      />
    </div>
  );
}