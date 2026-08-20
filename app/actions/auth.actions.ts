"use server";

import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { RegisterSchema, LoginSchema, RegisterInput, LoginInput } from "@/lib/validations/auth";
import { cookies } from "next/headers";

export async function registerUser(input: RegisterInput) {
  const validated = RegisterSchema.parse(input);

  const existing = await prisma.user.findUnique({
    where: { email: validated.email.toLowerCase() },
  });

  if (existing) {
    return { success: false, error: "An account with this email address already exists." };
  }

  const passwordHash = await hashPassword(validated.password);

  const newUser = await prisma.user.create({
    data: {
      name: validated.name,
      email: validated.email.toLowerCase(),
      phone: validated.phone || null,
      passwordHash,
      role: "CUSTOMER",
    },
  });

  // Set session cookie
  const cookieStore = await cookies();
  cookieStore.set("aarna_session_user", JSON.stringify({ id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return { success: true, user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role } };
}

export async function loginUser(input: LoginInput) {
  const validated = LoginSchema.parse(input);

  const user = await prisma.user.findUnique({
    where: { email: validated.email.toLowerCase() },
  });

  if (!user || user.status === "BLOCKED") {
    return { success: false, error: "Invalid email or password" };
  }

  const isValidPassword = await verifyPassword(validated.password, user.passwordHash);
  if (!isValidPassword) {
    return { success: false, error: "Invalid email or password" };
  }

  const cookieStore = await cookies();
  cookieStore.set("aarna_session_user", JSON.stringify({ id: user.id, name: user.name, email: user.email, role: user.role }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return { success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
}

export async function logoutUser() {
  const cookieStore = await cookies();
  cookieStore.delete("aarna_session_user");
  return { success: true };
}
