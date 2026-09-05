"use server";

import { prisma } from "@/lib/db";
import { cookies } from "next/headers";
import { verifySessionToken } from "@/lib/auth";
import { AddressSchema, AddressInput } from "@/lib/validations/auth";
import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { City, State } from "country-state-city";

async function requireSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("aarna_session_user")?.value;
  const session = await verifySessionToken(token);
  if (!session) throw new Error("Not authenticated");
  return session;
}

export async function getAddresses() {
  const session = await requireSession();
  return prisma.address.findMany({
    where: { userId: session.id },
    orderBy: [{ isDefault: "desc" }, { id: "asc" }],
  });
}

type CreateAddressResult =
  | { success: true }
  | { success: false; error: string; fieldErrors?: Partial<Record<keyof AddressInput, string>> };

export async function createAddress(input: AddressInput): Promise<CreateAddressResult> {
  try {
    const session = await requireSession();
    const validated = AddressSchema.parse(input);
    const selectedState = State.getStatesOfCountry("IN").find((state) => state.name === validated.state);
    const validCity = selectedState && City.getCitiesOfState("IN", selectedState.isoCode)
      .some((city) => city.name === validated.city);
    if (!selectedState || !validCity) {
      return { success: false, error: "Please select a valid Indian state and city." };
    }

    // If this is the user's first address, or they explicitly asked for
    // default, make sure only one address is ever marked default.
    const existingCount = await prisma.address.count({ where: { userId: session.id } });
    const shouldBeDefault = validated.isDefault || existingCount === 0;

    if (shouldBeDefault) {
      await prisma.address.updateMany({
        where: { userId: session.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    await prisma.address.create({
      data: { ...validated, userId: session.id, isDefault: shouldBeDefault },
    });

    revalidatePath("/addresses");
    revalidatePath("/checkout");
    return { success: true };
  } catch (error) {
    if (error instanceof ZodError) {
      // Turn Zod's issue list into a simple field -> message map the form can display.
      const fieldErrors: Partial<Record<keyof AddressInput, string>> = {};
      for (const issue of error.issues) {
        const field = issue.path[0] as keyof AddressInput;
        if (field && !fieldErrors[field]) fieldErrors[field] = issue.message;
      }
      return { success: false, error: "Please fix the highlighted fields.", fieldErrors };
    }
    if (error instanceof Error && error.message === "Not authenticated") {
      return { success: false, error: "Please log in to save an address." };
    }
    console.error("createAddress failed:", error);
    return { success: false, error: "Could not save address. Please try again." };
  }
}

export async function deleteAddress(addressId: string) {
  const session = await requireSession();

  // Scope the delete to this user's own addresses — prevents deleting
  // another user's address by guessing/tampering with an id.
  const address = await prisma.address.findFirst({
    where: { id: addressId, userId: session.id },
    select: { id: true, isDefault: true },
  });

  if (!address) {
    return { success: false, error: "Address not found" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.address.delete({ where: { id: address.id } });
    if (address.isDefault) {
      const replacement = await tx.address.findFirst({
        where: { userId: session.id },
        orderBy: { id: "asc" },
        select: { id: true },
      });
      if (replacement) {
        await tx.address.update({ where: { id: replacement.id }, data: { isDefault: true } });
      }
    }
  });

  revalidatePath("/addresses");
  revalidatePath("/checkout");
  return { success: true };
}

export async function setDefaultAddress(addressId: string) {
  const session = await requireSession();

  const address = await prisma.address.findFirst({
    where: { id: addressId, userId: session.id },
  });
  if (!address) return { success: false, error: "Address not found" };

  await prisma.$transaction([
    prisma.address.updateMany({
      where: { userId: session.id, isDefault: true },
      data: { isDefault: false },
    }),
    prisma.address.update({
      where: { id: addressId },
      data: { isDefault: true },
    }),
  ]);

  revalidatePath("/addresses");
  revalidatePath("/checkout");
  return { success: true };
}
