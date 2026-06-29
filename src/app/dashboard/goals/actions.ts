"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getUserId, str, num } from "@/lib/actions";
import { getPeriodKey, type GoalPeriod } from "@/lib/period";

export async function createGoal(formData: FormData) {
  const userId = await getUserId();
  const title = str(formData.get("title"));
  if (!title) return;
  const period = (str(formData.get("period")) || "weekly") as GoalPeriod;
  const type = str(formData.get("type")) || "boolean";
  const periodKey = getPeriodKey(period, new Date());
  await prisma.goal.create({
    data: {
      userId,
      title,
      period,
      periodKey,
      type,
      targetValue: type === "numeric" ? num(formData.get("targetValue"), 1) : null,
      currentValue: 0,
      status: "active",
    },
  });
  revalidatePath("/dashboard/goals");
}

export async function toggleGoalComplete(formData: FormData) {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  const goal = await prisma.goal.findFirst({ where: { id, userId } });
  if (!goal || goal.type !== "boolean") return;
  const completed = goal.status !== "completed";
  await prisma.goal.update({
    where: { id },
    data: { status: completed ? "completed" : "active" },
  });
  revalidatePath("/dashboard/goals");
}

export async function incrementGoal(formData: FormData) {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  const goal = await prisma.goal.findFirst({ where: { id, userId, type: "numeric" } });
  if (!goal) return;
  const next = goal.currentValue + 1;
  const target = goal.targetValue ?? 1;
  await prisma.goal.update({
    where: { id },
    data: {
      currentValue: next,
      status: next >= target ? "completed" : "active",
    },
  });
  revalidatePath("/dashboard/goals");
}

export async function deleteGoal(formData: FormData) {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  await prisma.goal.updateMany({ where: { id, userId }, data: { deletedAt: new Date() } });
  revalidatePath("/dashboard/goals");
}
