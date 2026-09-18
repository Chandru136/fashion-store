"use server";

import { value, choice, type ListParams } from "@/lib/listing";
import { SESSION_COOKIE_NAME } from "@/lib/session-config";

import { prisma } from "@/lib/db";
import { cookies } from "next/headers";
import { verifySessionToken } from "@/lib/auth";
import { BannerSchema, BannerInput } from "@/lib/validations/banner";
import { revalidatePath } from "next/cache";
import { ZodError } from "zod";

async function requireAdmin() {
  const cookieStore = await cookies();
  const token =
    cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionToken(token);

  if (!session || session.role === "CUSTOMER") {
    throw new Error("Not authorized");
  }

  return session;
}

type ActionResult =
  | { success: true }
  | { success: false; error: string; fieldErrors?: Partial<Record<keyof BannerInput, string>> };

export async function getAllBanners(params: ListParams = {}) {
  await requireAdmin();
  const q = value(params, "q");
  const status = choice(params, "status", ["ACTIVE", "INACTIVE"]);
  const placement = choice(params, "placement", ["HERO", "PROMO"]);
  const sort = choice(params, "sort", ["display", "title"], "display");
  return prisma.banner.findMany({
    where: { ...(q ? { title: { contains: q, mode: "insensitive" } } : {}), ...(status ? { status } : {}), ...(placement ? { placement } : {}) },
    orderBy: sort === "title" ? [{ title: "asc" }, { id: "asc" }] : [{ placement: "asc" }, { displayOrder: "asc" }, { id: "asc" }],
  });
}

export async function getBanner(id: string) {
  await requireAdmin();
  return prisma.banner.findUnique({ where: { id } });
}

// Public — no admin check. Used by the homepage to render live banners.
// Only ever returns ACTIVE banners for the requested placement.
export async function getActiveBanners(placement: "HERO" | "PROMO") {
  return prisma.banner.findMany({
    where: { status: "ACTIVE", placement },
    orderBy: [{ displayOrder: "asc" }, { id: "asc" }],
  });
}

export async function createBanner(input: BannerInput): Promise<ActionResult> {
  try {
    await requireAdmin();
    const validated = BannerSchema.parse(input);

    await prisma.banner.create({
      data: {
        title: validated.title,
        subtitle: validated.subtitle || null,
        desktopImage: validated.desktopImage,
        mobileImage: validated.mobileImage || null,
        buttonText: validated.buttonText?.trim() || null,
        buttonUrl: validated.buttonUrl?.trim() || null,
        placement: validated.placement,
        startDate: validated.startDate ? new Date(validated.startDate) : null,
        endDate: validated.endDate ? new Date(validated.endDate) : null,
        status: validated.status,
        displayOrder: validated.displayOrder,
      },
    });

    revalidatePath("/admin/banners");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function updateBanner(id: string, input: BannerInput): Promise<ActionResult> {
  try {
    await requireAdmin();
    const validated = BannerSchema.parse(input);

    await prisma.banner.update({
      where: { id },
      data: {
        title: validated.title,
        subtitle: validated.subtitle || null,
        desktopImage: validated.desktopImage,
        mobileImage: validated.mobileImage || null,
        buttonText: validated.buttonText?.trim() || null,
        buttonUrl: validated.buttonUrl?.trim() || null,
        placement: validated.placement,
        startDate: validated.startDate ? new Date(validated.startDate) : null,
        endDate: validated.endDate ? new Date(validated.endDate) : null,
        status: validated.status,
        displayOrder: validated.displayOrder,
      },
    });

    revalidatePath("/admin/banners");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function deleteBanner(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await prisma.banner.delete({ where: { id } });
    revalidatePath("/admin/banners");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function toggleBannerStatus(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const banner = await prisma.banner.findUnique({ where: { id } });
    if (!banner) return { success: false, error: "Banner not found" };

    await prisma.banner.update({
      where: { id },
      data: { status: banner.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" },
    });

    revalidatePath("/admin/banners");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function reorderBanner(id: string, newOrder: number): Promise<ActionResult> {
  try {
    await requireAdmin();
    await prisma.banner.update({
      where: { id },
      data: { displayOrder: newOrder },
    });
    revalidatePath("/admin/banners");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return handleActionError(error);
  }
}

function handleActionError(error: unknown): ActionResult {
  if (error instanceof ZodError) {
    const fieldErrors: Partial<Record<keyof BannerInput, string>> = {};
    for (const issue of error.issues) {
      const field = issue.path[0] as keyof BannerInput;
      if (field && !fieldErrors[field]) fieldErrors[field] = issue.message;
    }
    return { success: false, error: "Please fix the highlighted fields.", fieldErrors };
  }
  if (error instanceof Error && error.message === "Not authorized") {
    return { success: false, error: "You don't have permission to do this." };
  }
  console.error("Banner action failed:", error);
  return { success: false, error: "Something went wrong. Please try again." };
}