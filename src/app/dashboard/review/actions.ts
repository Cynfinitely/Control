"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getUserId, str } from "@/lib/actions";
import { revalidateUserCache } from "@/lib/cache";
import { getPeriodKey } from "@/lib/period";
import { success, failure, type ActionResult } from "@/lib/action-result";
import { isReviewStepId, isWeekKey, toggleCompletedStep } from "@/lib/review";

function invalidate(userId: string) {
  revalidateUserCache(userId, "dashboard", "review");
  revalidatePath("/dashboard/review");
  revalidatePath("/dashboard");
}

/** The week being reviewed: the page's week key when valid, else the current ISO week. */
function resolveWeekKey(formData: FormData): string {
  const raw = str(formData.get("weekKey"));
  return isWeekKey(raw) ? raw : getPeriodKey("weekly", new Date());
}

export async function toggleReviewStep(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const weekKey = resolveWeekKey(formData);
  const step = str(formData.get("step"));
  if (!isReviewStepId(step)) return failure("Unknown review step");
  const doneRaw = str(formData.get("done"));
  const done = doneRaw === "1" ? true : doneRaw === "0" ? false : undefined;

  const existing = await prisma.weeklyReview.findUnique({
    where: { userId_weekKey: { userId, weekKey } },
    select: { completedSteps: true },
  });
  const completedSteps = toggleCompletedStep(existing?.completedSteps, step, done);

  await prisma.weeklyReview.upsert({
    where: { userId_weekKey: { userId, weekKey } },
    update: { completedSteps },
    create: { userId, weekKey, completedSteps },
  });
  invalidate(userId);
  return success();
}

export async function saveReviewNotes(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const weekKey = resolveWeekKey(formData);
  const notes = str(formData.get("notes")) || null;
  if (notes && notes.length > 10000) return failure("Notes are too long (max 10,000 characters)");

  await prisma.weeklyReview.upsert({
    where: { userId_weekKey: { userId, weekKey } },
    update: { notes },
    create: { userId, weekKey, notes },
  });
  invalidate(userId);
  return success("Notes saved");
}

export async function completeReview(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const weekKey = resolveWeekKey(formData);
  const now = new Date();

  await prisma.weeklyReview.upsert({
    where: { userId_weekKey: { userId, weekKey } },
    update: { completedAt: now },
    create: { userId, weekKey, completedAt: now },
  });
  invalidate(userId);
  return success("Weekly review complete");
}

export async function reopenReview(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const weekKey = resolveWeekKey(formData);

  const result = await prisma.weeklyReview.updateMany({
    where: { userId, weekKey },
    data: { completedAt: null },
  });
  if (result.count === 0) return failure("No review to reopen");
  invalidate(userId);
  return success("Review reopened");
}
