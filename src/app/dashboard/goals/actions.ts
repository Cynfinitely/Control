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

export async function decrementGoal(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  if (!id) return failure("Invalid goal");
  const goal = await prisma.goal.findFirst({
    where: { id, userId, type: "numeric", deletedAt: null },
    select: { currentValue: true, targetValue: true, status: true },
  });
  if (!goal) return failure("Goal not found");
  if (goal.currentValue <= 0) return failure("Already at 0");

  const latest = await prisma.goalCheckIn.findFirst({
    where: { goalId: id },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    select: { id: true, value: true },
  });
  const amount = latest?.value && latest.value > 0 ? latest.value : 1;
  const next = Math.max(0, goal.currentValue - amount);

  if (latest) await prisma.goalCheckIn.delete({ where: { id: latest.id } });
  await prisma.goal.updateMany({
    where: { id, userId },
    data: {
      currentValue: next,
      // Undo an auto-complete when the goal drops back below its target.
      ...(goal.status === "completed" && next < (goal.targetValue ?? 1) ? { status: "active" } : {}),
    },
  });
  invalidate(userId);
  return success();
}

export async function addMilestone(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const goalId = str(formData.get("goalId"));
  const title = str(formData.get("title"));
  if (!title) return failure("Milestone title is required");
  const owns = await prisma.goal.findFirst({ where: { id: goalId, userId } });
  if (!owns) return failure("Goal not found");
  await prisma.goalMilestone.create({ data: { goalId, title } });
  invalidate(userId);
  return success("Milestone added");
}

export async function toggleMilestone(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  const goalId = str(formData.get("goalId"));
  const ms = await prisma.goalMilestone.findFirst({
    where: { id, goal: { userId, id: goalId } },
  });
  if (!ms) return failure("Milestone not found");
  await prisma.goalMilestone.update({
    where: { id },
    data: { done: !ms.done, completedAt: !ms.done ? new Date() : null },
  });
  invalidate(userId);
  return success();
}

export async function deleteMilestone(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  const goalId = str(formData.get("goalId"));
  const ms = await prisma.goalMilestone.findFirst({
    where: { id, goal: { userId, id: goalId } },
  });
  if (!ms) return failure("Milestone not found");
  await prisma.goalMilestone.delete({ where: { id } });
  invalidate(userId);
  return success("Milestone deleted");
}

export async function rolloverGoals(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const period = (str(formData.get("period")) || "weekly") as GoalPeriod;
  const fromKey = str(formData.get("fromPeriodKey"));
  const toKey = str(formData.get("toPeriodKey"));
  if (!fromKey || !toKey || fromKey === toKey) return failure("Nothing to carry over");

  const incomplete = await prisma.goal.findMany({
    where: {
      userId,
      deletedAt: null,
      period,
      periodKey: fromKey,
      status: "active",
    },
  });
  // Skip goals already carried over (same title in the destination period).
  const existing = await prisma.goal.findMany({
    where: { userId, deletedAt: null, period, periodKey: toKey },
    select: { title: true },
  });
  const existingTitles = new Set(existing.map((g) => g.title));
  const toCarry = incomplete.filter((g) => !existingTitles.has(g.title));
  if (toCarry.length === 0) return failure("Those goals are already in this period");

  for (const g of toCarry) {
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
  return success(`Carried ${toCarry.length} goal${toCarry.length === 1 ? "" : "s"} over`);
}
