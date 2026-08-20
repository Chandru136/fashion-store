import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { RoleEnum } from "@prisma/client";

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: RoleEnum;
}

// In Next.js App Router with custom server actions/headers, helper to retrieve session or mock user session
export async function getSessionUser(userId?: string): Promise<UserSession | null> {
  if (!userId) return null;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, status: true },
  });

  if (!user || user.status === "BLOCKED") return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}
