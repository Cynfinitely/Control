"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getUserId, str, optStr, parseDate } from "@/lib/actions";
import { revalidateUserCache } from "@/lib/cache";
import { startOfDay } from "@/lib/date";
import { success, failure, wrapFormAction, type ActionResult } from "@/lib/action-result";

const MAX_FOCUS_ITEMS = 8;
const LINK_TYPES = new Set(["career_goal", "skill"]);

function invalidateWork(userId: string) {
  revalidateUserCache(userId, "work", "dashboard");
  revalidatePath("/dashboard/work");
}

function parseLink(raw: string | null): { linkType: string | null; linkId: string | null } {
  if (!raw) return { linkType: null, linkId: null };
  const sep = raw.indexOf(":");
  if (sep <= 0) return { linkType: null, linkId: null };
  const linkType = raw.slice(0, sep);
  const linkId = raw.slice(sep + 1);
  if (!LINK_TYPES.has(linkType) || !linkId) return { linkType: null, linkId: null };
  return { linkType, linkId };
}

async function ensureWorkDay(userId: string, date: Date) {
  return prisma.workDay.upsert({
    where: { userId_date: { userId, date } },
    update: {},
    create: { userId, date },
  });
}

async function assertOwnedLink(userId: string, linkType: string | null, linkId: string | null) {
  if (!linkType || !linkId) return true;
  if (linkType === "career_goal") {
    const row = await prisma.careerGoal.findFirst({
      where: { id: linkId, userId, deletedAt: null },
      select: { id: true },
    });
    return Boolean(row);
  }
  if (linkType === "skill") {
    const row = await prisma.skill.findFirst({
      where: { id: linkId, userId, deletedAt: null },
      select: { id: true },
    });
    return Boolean(row);
  }
  return false;
}

export async function createFocusItem(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const title = str(formData.get("title"));
  if (!title) return failure("Title is required");

  const date = startOfDay(parseDate(formData.get("dayDate")));
  const { linkType, linkId } = parseLink(optStr(formData.get("link")) ?? null);
  if (!(await assertOwnedLink(userId, linkType, linkId))) {
    return failure("Invalid career link");
  }

  const day = await ensureWorkDay(userId, date);
  const openCount = await prisma.workFocusItem.count({
    where: { workDayId: day.id, deletedAt: null },
  });
  if (openCount >= MAX_FOCUS_ITEMS) {
    return failure(`Keep focus tight — max ${MAX_FOCUS_ITEMS} items per day`);
  }

  const maxSort = await prisma.workFocusItem.aggregate({
    where: { workDayId: day.id, deletedAt: null },
    _max: { sortOrder: true },
  });

  await prisma.workFocusItem.create({
    data: {
      userId,
      workDayId: day.id,
      title,
      linkType,
      linkId,
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
    },
  });

  invalidateWork(userId);
  return success("Focus item added");
}

export const createFocusItemForm = wrapFormAction(createFocusItem, "Focus item added");

export async function toggleFocusItem(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  if (!id) return failure("Invalid item");

  const openToDone = await prisma.workFocusItem.updateMany({
    where: { id, userId, deletedAt: null, status: "open" },
    data: { status: "done", completedAt: new Date() },
  });
  if (openToDone.count === 0) {
    await prisma.workFocusItem.updateMany({
      where: { id, userId, deletedAt: null, status: { in: ["done", "skipped"] } },
      data: { status: "open", completedAt: null },
    });
  }

  invalidateWork(userId);
  return success();
}

export async function skipFocusItem(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  if (!id) return failure("Invalid item");

  await prisma.workFocusItem.updateMany({
    where: { id, userId, deletedAt: null, status: "open" },
    data: { status: "skipped", completedAt: null },
  });

  invalidateWork(userId);
  return success("Marked skipped");
}

export async function deleteFocusItem(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  if (!id) return failure("Invalid item");

  await prisma.workFocusItem.updateMany({
    where: { id, userId },
    data: { deletedAt: new Date() },
  });

  invalidateWork(userId);
  return success("Focus item removed");
}

export async function restoreFocusItem(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  if (!id) return failure("Invalid item");

  await prisma.workFocusItem.updateMany({
    where: { id, userId },
    data: { deletedAt: null },
  });

  invalidateWork(userId);
  return success("Focus item restored");
}

export async function saveWorkLog(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const date = startOfDay(parseDate(formData.get("dayDate")));
  const logNote = optStr(formData.get("logNote"));

  await prisma.workDay.upsert({
    where: { userId_date: { userId, date } },
    update: { logNote },
    create: { userId, date, logNote },
  });

  invalidateWork(userId);
  return success("Work log saved");
}

export const saveWorkLogForm = wrapFormAction(saveWorkLog, "Work log saved");
