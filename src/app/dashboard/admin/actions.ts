"use server";

import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { str, num, optStr, parseOptionalDate } from "@/lib/actions";

async function requireAdminId(): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") return null;
  return session.user.id;
}

export async function createInvite(formData: FormData) {
  const adminId = await requireAdminId();
  if (!adminId) return;
  const custom = str(formData.get("code"));
  const code = custom || `INV-${randomBytes(4).toString("hex").toUpperCase()}`;
  await prisma.inviteCode.create({
    data: {
      code,
      email: optStr(formData.get("email")),
      maxUses: Math.max(1, num(formData.get("maxUses"), 1)),
      expiresAt: parseOptionalDate(formData.get("expiresAt")),
      createdById: adminId,
    },
  });
  revalidatePath("/dashboard/admin");
}

export async function deleteInvite(formData: FormData) {
  const adminId = await requireAdminId();
  if (!adminId) return;
  await prisma.inviteCode.delete({ where: { id: str(formData.get("id")) } });
  revalidatePath("/dashboard/admin");
}
