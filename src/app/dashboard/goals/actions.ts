"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getUserId, str, optStr, num, parseOptionalDate } from "@/lib/actions";

export async function createGoal(formData: FormData) {
  const userId = await getUserId();
  const title = str(formData.get("title"));
  if (!title) return;
  await prisma.goal.create({
    data: {
      userId,
      title,
      description: optStr(formData.get("description")),
      type: str(formData.get("type")) || "numeric",
      targetValue: formData.get("targetValue") ? num(formData.get("targetValue")) : null,
      unit: optStr(formData.get("unit")),
      targetDate: parseOptionalDate(formData.get("targetDate")),
    },
  });
  revalidatePath("/dashboard/goals");
}

export async function addCheckIn(formData: FormData) {
  const userId = await getUserId();
  const goalId = str(formData.get("goalId"));
  const goal = await prisma.goal.findFirst({ where: { id: goalId, userId } });
  if (!goal) return;
  const value = num(formData.get("value"));
  await prisma.$transaction([
    prisma.goalCheckIn.create({
      data: { goalId, value, note: optStr(formData.get("note")) },
    }),
    prisma.goal.update({ where: { id: goalId }, data: { currentValue: value } }),
  ]);
  revalidatePath("/dashboard/goals");
}

export async function setGoalStatus(formData: FormData) {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  const status = str(formData.get("status"));
  await prisma.goal.updateMany({ where: { id, userId }, data: { status } });
  revalidatePath("/dashboard/goals");
}

export async function deleteGoal(formData: FormData) {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  await prisma.goal.updateMany({ where: { id, userId }, data: { deletedAt: new Date() } });
  revalidatePath("/dashboard/goals");
}
