"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { str, num, optStr } from "@/lib/actions";
import { generateInviteCode, inviteExpiry, INVITE_DEFAULT_DAYS } from "@/lib/invites";
import { success, failure, type ActionResult } from "@/lib/action-result";

async function requireAdminId(): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") return null;
  return session.user.id;
}

export async function createInvite(formData: FormData): Promise<ActionResult> {
  const adminId = await requireAdminId();
  if (!adminId) return failure("Only admins can create invites.");

  const email = optStr(formData.get("email"))?.toLowerCase() ?? null;
  if (email && !z.string().email().safeParse(email).success) return failure("Enter a valid email address.");

  await prisma.inviteCode.create({
    data: {
      code: generateInviteCode(),
      email,
      maxUses: Math.min(50, Math.max(1, Math.round(num(formData.get("maxUses"), 1)))),
      expiresAt: inviteExpiry(num(formData.get("expiresInDays"), INVITE_DEFAULT_DAYS)),
      createdById: adminId,
    },
  });
  revalidatePath("/dashboard/admin");
  return success("Invite created. Copy its link and send it to the person.");
}

export async function deleteInvite(formData: FormData): Promise<ActionResult> {
  const adminId = await requireAdminId();
  if (!adminId) return failure("Only admins can delete invites.");
  const id = str(formData.get("id"));
  if (!id) return failure("Invite not found.");
  const result = await prisma.inviteCode.deleteMany({ where: { id } });
  if (result.count === 0) return failure("Invite not found — it may already be deleted.");
  revalidatePath("/dashboard/admin");
  return success("Invite deleted");
}
