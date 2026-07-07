"use server";

import { prisma } from "@/lib/db";
import { getUserId, str, num, optStr } from "@/lib/actions";
import { revalidateUserCache } from "@/lib/cache";
import { getPeriodKey, type GoalPeriod } from "@/lib/period";
import { success, failure, wrapFormAction, type ActionResult } from "@/lib/action-result";

function invalidate(userId: string) {
  revalidateUserCache(userId, "goals", "dashboard");
}

export async function createGoal(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const title = str(formData.get("title"));
  if (!title) return failure("Title is required");
  const period = (str(formData.get("period")) || "weekly") as GoalPeriod;
  const type = str(formData.get("type")) || "boolean";
  const periodKey = str(formData.get("periodKey")) || getPeriodKey(period, new Date());
  const linkType = optStr(formData.get("linkType"));
  await prisma.goal.create({
    data: {
      userId,
      title,
      period,
      periodKey,
      type,
      linkType: type === "numeric" ? linkType : null,
      targetValue: type === "numeric" ? num(formData.get("targetValue"), 1) : null,
      currentValue: 0,
      status: "active",
    },
  });
  invalidate(userId);
  return success("Goal added");
}

export const createGoalForm = wrapFormAction(createGoal, "Goal added");

export async function toggleGoalComplete(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  if (!id) return failure("Invalid goal");
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
  return success();
}

export async function incrementGoal(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  if (!id) return failure("Invalid goal");
  const note = optStr(formData.get("note"));
  await prisma.goal.updateMany({
    where: { id, userId, type: "numeric" },
    data: { currentValue: { increment: 1 } },
  });
  const goal = await prisma.goal.findFirst({
    where: { id, userId, type: "numeric" },
    select: { currentValue: true, targetValue: true },
  });
  if (goal) {
    await prisma.goalCheckIn.create({
      data: { goalId: id, value: 1, note },
    });
    if (goal.currentValue >= (goal.targetValue ?? 1)) {
      await prisma.goal.updateMany({
        where: { id, userId, status: "active" },
        data: { status: "completed" },
      });
    }
  }
  invalidate(userId);
  return success();
}

export async function deleteGoal(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  if (!id) return failure("Invalid goal");
  await prisma.goal.updateMany({ where: { id, userId }, data: { deletedAt: new Date() } });
  invalidate(userId);
  return success("Goal deleted");
}

export async function restoreGoal(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  if (!id) return failure("Invalid goal");
  await prisma.goal.updateMany({ where: { id, userId }, data: { deletedAt: null } });
  invalidate(userId);
  return success("Goal restored");
}

export async function addMilestone(formData: FormData) {
  const userId = await getUserId();
  const goalId = str(formData.get("goalId"));
  const title = str(formData.get("title"));
  if (!title) return;
  const owns = await prisma.goal.findFirst({ where: { id: goalId, userId } });
  if (!owns) return;
  await prisma.goalMilestone.create({ data: { goalId, title } });
  invalidate(userId);
}

export async function toggleMilestone(formData: FormData) {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  const goalId = str(formData.get("goalId"));
  const ms = await prisma.goalMilestone.findFirst({
    where: { id, goal: { userId, id: goalId } },
  });
  if (!ms) return;
  await prisma.goalMilestone.update({
    where: { id },
    data: { done: !ms.done, completedAt: !ms.done ? new Date() : null },
  });
  invalidate(userId);
}

export async function deleteMilestone(formData: FormData) {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  const goalId = str(formData.get("goalId"));
  const ms = await prisma.goalMilestone.findFirst({
    where: { id, goal: { userId, id: goalId } },
  });
  if (!ms) return;
  await prisma.goalMilestone.delete({ where: { id } });
  invalidate(userId);
}

export async function rolloverGoals(formData: FormData) {
  const userId = await getUserId();
  const period = (str(formData.get("period")) || "weekly") as GoalPeriod;
  const fromKey = str(formData.get("fromPeriodKey"));
  const toKey = str(formData.get("toPeriodKey"));
  if (!fromKey || !toKey || fromKey === toKey) return;

  const incomplete = await prisma.goal.findMany({
    where: {
      userId,
      deletedAt: null,
      period,
      periodKey: fromKey,
      status: "active",
    },
  });

  for (const g of incomplete) {
    await prisma.goal.create({
      data: {
        userId,
        title: g.title,
        period: g.period,
        periodKey: toKey,
        type: g.type,
        linkType: g.linkType,
        targetValue: g.targetValue,
        currentValue: g.type === "numeric" ? g.currentValue : 0,
        status: "active",
      },
    });
  }
  invalidate(userId);
}
