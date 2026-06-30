"use server";

import { prisma } from "@/lib/db";
import { getUserId, str, num } from "@/lib/actions";
import { revalidateUserCache } from "@/lib/cache";
import { getPeriodKey, type GoalPeriod } from "@/lib/period";

function invalidate(userId: string) {
  revalidateUserCache(userId, "goals", "dashboard");
}

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
  invalidate(userId);
}

export async function toggleGoalComplete(formData: FormData) {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  const toCompleted = await prisma.goal.updateMany({
    where: { id, userId, type: "boolean", status: "active" },
    data: { status: "completed" },
  });
  if (toCompleted.count === 0) {
    await prisma.goal.updateMany({
      where: { id, userId, type: "boolean", status: "completed" },
      data: { status: "active" },
    });
  }
  invalidate(userId);
}

export async function incrementGoal(formData: FormData) {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  await prisma.goal.updateMany({
    where: { id, userId, type: "numeric" },
    data: { currentValue: { increment: 1 } },
  });
  const goal = await prisma.goal.findFirst({
    where: { id, userId, type: "numeric" },
    select: { currentValue: true, targetValue: true },
  });
  if (goal && goal.currentValue >= (goal.targetValue ?? 1)) {
    await prisma.goal.updateMany({
      where: { id, userId, status: "active" },
      data: { status: "completed" },
    });
  }
  invalidate(userId);
}

export async function deleteGoal(formData: FormData) {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  await prisma.goal.updateMany({ where: { id, userId }, data: { deletedAt: new Date() } });
  invalidate(userId);
}
