"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { z, ZodError } from "zod";
import { prisma } from "@/lib/db";
import { verifySessionToken } from "@/lib/auth";
import { SESSION_COOKIE_NAME } from "@/lib/session-config";
import { BrandSchema, type BrandInput } from "@/lib/validations/brand";

async function requireBrandAdmin() {
  const session = await verifySessionToken((await cookies()).get(SESSION_COOKIE_NAME)?.value);
  const user = session ? await prisma.user.findUnique({ where: { id: session.id }, select: { role: true, status: true } }) : null;
  if (!user || user.status !== "ACTIVE" || user.role === "CUSTOMER") throw new Error("BRAND_ACCESS_DENIED");
}

function refreshBrands() {
  revalidatePath("/admin/brands");
  revalidatePath("/admin/products");
  revalidatePath("/admin/products/new");
  revalidatePath("/admin/products/[id]/edit", "page");
  revalidatePath("/", "layout");
}

function brandError(error: unknown) {
  if (error instanceof ZodError) return { success: false as const, error: error.issues[0]?.message || "Check the brand details." };
  if (error instanceof Error && error.message === "BRAND_ACCESS_DENIED") return { success: false as const, error: "You are not authorized to manage brands." };
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") return { success: false as const, error: "That brand slug is already in use. Choose a different slug." };
    if (error.code === "P2025") return { success: false as const, error: "This brand no longer exists. Refresh the page." };
  }
  return { success: false as const, error: "Unable to save your brand changes. Please try again." };
}

async function saveBrand(input: BrandInput, id?: string) {
  try {
    await requireBrandAdmin();
    const parsed = BrandSchema.parse(input);
    const data = { ...parsed, description: parsed.description || null, logo: parsed.logo || null };
    if (id !== undefined) {
      z.string().min(1).max(100).parse(id);
      await prisma.brand.update({ where: { id }, data });
    } else {
      await prisma.brand.create({ data });
    }
    refreshBrands();
    return { success: true as const };
  } catch (error) {
    return brandError(error);
  }
}

export async function createBrandAction(input: BrandInput) {
  return saveBrand(input);
}

export async function updateBrandAction(id: string, input: BrandInput) {
  // Validate before dispatch so a missing ID cannot turn an update into a create.
  if (typeof id !== "string" || !id) return { success: false as const, error: "Select a brand to update." };
  return saveBrand(input, id);
}

export async function deleteBrandAction(id: string) {
  try {
    await requireBrandAdmin();
    z.string().min(1).max(100).parse(id);
    await prisma.$transaction(async (tx) => {
      await tx.product.updateMany({ where: { brandId: id }, data: { brandId: null } });
      await tx.brand.delete({ where: { id } });
    });
    refreshBrands();
    return { success: true as const };
  } catch (error) {
    return brandError(error);
  }
}
