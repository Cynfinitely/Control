"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getUserId, str } from "@/lib/actions";
import { revalidateUserCache } from "@/lib/cache";
import { startOfDay } from "@/lib/date";
import { PRINCIPLE_CATEGORY_ORDER, type PrincipleCategory } from "@/lib/principles/seed";
import { success, failure, wrapFormAction, type ActionResult } from "@/lib/action-result";

function invalidate(userId: string) {
  revalidateUserCache(userId, "principles", "dashboard");
  revalidatePath("/dashboard/principles");
  revalidatePath("/dashboard");
}

function parseCategory(raw: string | null): PrincipleCategory | null {
  if (!raw) return null;
  return PRINCIPLE_CATEGORY_ORDER.includes(raw as PrincipleCategory)
    ? (raw as PrincipleCategory)
    : null;
}

export async function createPrinciple(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const text = str(formData.get("text"));
  const category = parseCategory(str(formData.get("category")));
  if (!text) return failure("Text is required");
  if (!category) return failure("Category is required");

  const max = await prisma.principle.aggregate({
    where: { userId },
    _max: { sortOrder: true },
  });
  const sortOrder = (max._max.sortOrder ?? 0) + 1;

  await prisma.principle.create({
    data: { userId, text, category, sortOrder },
  });
  invalidate(userId);
  return success("Principle added");
}

export async function updatePrinciple(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  const text = str(formData.get("text"));
  const category = parseCategory(str(formData.get("category")));
  if (!id) return failure("Invalid principle");
  if (!text) return failure("Text is required");
  if (!category) return failure("Category is required");

  const result = await prisma.principle.updateMany({
    where: { id, userId, archivedAt: null },
    data: { text, category },
  });
  if (result.count === 0) return failure("Principle not found");
  invalidate(userId);
  return success("Principle updated");
}

export async function archivePrinciple(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  if (!id) return failure("Invalid principle");

  const result = await prisma.principle.updateMany({
    where: { id, userId, archivedAt: null },
    data: { archivedAt: new Date() },
  });
  if (result.count === 0) return failure("Principle not found");
  invalidate(userId);
  return success("Principle archived");
}

export async function markPrinciplesReviewed(_formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const date = startOfDay(new Date());

  await prisma.principleReview.upsert({
    where: { userId_date: { userId, date } },
    update: { reviewedAt: new Date() },
    create: { userId, date, reviewedAt: new Date() },
  });
  invalidate(userId);
  return success("Marked as reviewed");
}

export const createPrincipleForm = wrapFormAction(createPrinciple, "Principle added");
export const updatePrincipleForm = wrapFormAction(updatePrinciple, "Principle updated");
export const archivePrincipleForm = wrapFormAction(archivePrinciple, "Principle archived");
export const markPrinciplesReviewedForm = wrapFormAction(
  markPrinciplesReviewed,
  "Marked as reviewed"
);
