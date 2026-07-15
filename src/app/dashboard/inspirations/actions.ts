"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getUserId, str, optStr } from "@/lib/actions";
import { revalidateUserCache } from "@/lib/cache";
import { success, failure, wrapFormAction, type ActionResult } from "@/lib/action-result";

function invalidate(userId: string) {
  revalidateUserCache(userId, "inspirations", "dashboard");
  revalidatePath("/dashboard/inspirations");
  revalidatePath("/dashboard");
}

export async function createInspiration(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const text = str(formData.get("text"));
  if (!text) return failure("Text is required");
  await prisma.inspiration.create({
    data: { userId, text, author: optStr(formData.get("author")) },
  });
  invalidate(userId);
  return success("Inspiration added");
}

export async function updateInspiration(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  const text = str(formData.get("text"));
  if (!id) return failure("Invalid inspiration");
  if (!text) return failure("Text is required");
  const result = await prisma.inspiration.updateMany({
    where: { id, userId },
    data: { text, author: optStr(formData.get("author")) },
  });
  if (result.count === 0) return failure("Inspiration not found");
  invalidate(userId);
  return success("Inspiration updated");
}

export async function deleteInspiration(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  if (!id) return failure("Invalid inspiration");
  const result = await prisma.inspiration.deleteMany({ where: { id, userId } });
  if (result.count === 0) return failure("Inspiration not found");
  invalidate(userId);
  return success("Inspiration deleted");
}

export const createInspirationForm = wrapFormAction(createInspiration, "Inspiration added");
export const updateInspirationForm = wrapFormAction(updateInspiration, "Inspiration updated");
export const deleteInspirationForm = wrapFormAction(deleteInspiration, "Inspiration deleted");
