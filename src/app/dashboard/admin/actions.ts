"use server";

import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { str, num, optStr, parseOptionalDate } from "@/lib/actions";
import { success, failure, type ActionResult } from "@/lib/action-result";

async function requireAdminId(): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") return null;
  return session.user.id;
}

function isUniqueViolation(err: unknown) {
  return typeof err === "object" && err !== null && (err as { code?: unknown }).code === "P2002";
}

export async function createInvite(formData: FormData): Promise<ActionResult> {
  const adminId = await requireAdminId();
  if (!adminId) return failure("Only admins can create invite codes.");
  const custom = str(formData.get("code"));
  const code = custom || `INV-${randomBytes(4).toString("hex").toUpperCase()}`;

  const existing = await prisma.inviteCode.findUnique({ where: { code }, select: { id: true } });
  if (existing) return failure("That code already exists. Choose another or leave it blank to generate one.");

  try {
    await prisma.inviteCode.create({
      data: {
        code,
        email: optStr(formData.get("email")),
        maxUses: Math.max(1, num(formData.get("maxUses"), 1)),
        expiresAt: parseOptionalDate(formData.get("expiresAt")),
        createdById: adminId,
      },
    });
  } catch (err) {
    if (isUniqueViolation(err)) return failure("That code already exists. Choose another or leave it blank to generate one.");
    throw err;
  }
  revalidatePath("/dashboard/admin");
  return success(`Invite ${code} created`);
}

export async function deleteInvite(formData: FormData): Promise<ActionResult> {
  const adminId = await requireAdminId();
  if (!adminId) return failure("Only admins can delete invite codes.");
  const id = str(formData.get("id"));
  if (!id) return failure("Invite not found.");
  const result = await prisma.inviteCode.deleteMany({ where: { id } });
  if (result.count === 0) return failure("Invite not found — it may already be deleted.");
  revalidatePath("/dashboard/admin");
  return success("Invite deleted");
}
