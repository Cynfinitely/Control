"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getUserId, str, optStr } from "@/lib/actions";
import { revalidateUserCache } from "@/lib/cache";
import { MAX_LIFE_PRIORITIES, neighborForMove } from "@/lib/priorities/rank";
import { success, failure, wrapFormAction, type ActionResult } from "@/lib/action-result";

function invalidate(userId: string) {
  revalidateUserCache(userId, "priorities", "dashboard");
  revalidatePath("/dashboard/priorities");
  revalidatePath("/dashboard");
}

export async function createPriority(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const title = str(formData.get("title"));
  const note = optStr(formData.get("note"));
  if (!title) return failure("Title is required");

  const count = await prisma.lifePriority.count({ where: { userId } });
  if (count >= MAX_LIFE_PRIORITIES) {
    return failure(`You can have at most ${MAX_LIFE_PRIORITIES} priorities`);
  }

  const max = await prisma.lifePriority.aggregate({
    where: { userId },
    _max: { sortOrder: true },
  });
  const sortOrder = (max._max.sortOrder ?? -1) + 1;

  await prisma.lifePriority.create({
    data: { userId, title, note, sortOrder },
  });
  invalidate(userId);
  return success("Priority added");
}

export async function updatePriority(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  const title = str(formData.get("title"));
  const note = optStr(formData.get("note"));
  if (!id) return failure("Invalid priority");
  if (!title) return failure("Title is required");

  const result = await prisma.lifePriority.updateMany({
    where: { id, userId },
    data: { title, note },
  });
  if (result.count === 0) return failure("Priority not found");
  invalidate(userId);
  return success("Priority updated");
}

export async function deletePriority(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  if (!id) return failure("Invalid priority");

  const result = await prisma.lifePriority.deleteMany({
    where: { id, userId },
  });
  if (result.count === 0) return failure("Priority not found");
  invalidate(userId);
  return success("Priority removed");
}

export async function movePriority(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  const direction = str(formData.get("direction"));
  if (!id) return failure("Invalid priority");
  if (direction !== "up" && direction !== "down") return failure("Invalid direction");

  const items = await prisma.lifePriority.findMany({
    where: { userId },
    select: { id: true, sortOrder: true },
  });
  const current = items.find((item) => item.id === id);
  if (!current) return failure("Priority not found");

  const neighbor = neighborForMove(items, id, direction);
  if (!neighbor) return failure("Can't move further");

  await prisma.$transaction([
    prisma.lifePriority.update({
      where: { id: current.id },
      data: { sortOrder: neighbor.sortOrder },
    }),
    prisma.lifePriority.update({
      where: { id: neighbor.id },
      data: { sortOrder: current.sortOrder },
    }),
  ]);
  invalidate(userId);
  return success();
}

export const createPriorityForm = wrapFormAction(createPriority, "Priority added");
export const updatePriorityForm = wrapFormAction(updatePriority, "Priority updated");
export const deletePriorityForm = wrapFormAction(deletePriority, "Priority removed");
export const movePriorityForm = wrapFormAction(movePriority);
