"use server";

import { prisma } from "@/lib/db";
import { getUserId, str, parseDate, parseOptionalDate } from "@/lib/actions";
import { revalidateUserCache } from "@/lib/cache";
import { startOfDay, endOfDay } from "@/lib/date";
import { success, failure, wrapFormAction, type ActionResult } from "@/lib/action-result";

function invalidate(userId: string) {
  revalidateUserCache(userId, "todos", "dashboard", "plan");
}

export async function createTodo(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const title = str(formData.get("title"));
  if (!title) return failure("Title is required");
  const dayDate = startOfDay(parseDate(formData.get("dayDate")));
  const priority = str(formData.get("priority")) || "medium";
  const category = str(formData.get("category")) || null;
  const dueDate = parseOptionalDate(formData.get("dueDate"));
  await prisma.todo.create({
    data: { userId, title, dayDate, inBacklog: false, priority, category, dueDate },
  });
  invalidate(userId);
  return success("Todo added");
}

export const createTodoForm = wrapFormAction(createTodo, "Todo added");

export async function toggleTodo(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  if (!id) return failure("Invalid todo");
  const openToDone = await prisma.todo.updateMany({
    where: { id, userId, status: "open" },
    data: { status: "done", completedAt: new Date() },
  });
  if (openToDone.count === 0) {
    await prisma.todo.updateMany({
      where: { id, userId, status: "done" },
      data: { status: "open", completedAt: null },
    });
  }
  invalidate(userId);
  return success();
}

export async function moveToBacklog(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  if (!id) return failure("Invalid todo");
  await prisma.todo.updateMany({
    where: { id, userId, status: "open" },
    data: { inBacklog: true },
  });
  invalidate(userId);
  return success("Moved to backlog");
}

export async function pullFromBacklog(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  if (!id) return failure("Invalid todo");
  const dayDate = startOfDay(parseDate(formData.get("dayDate")));
  await prisma.todo.updateMany({
    where: { id, userId, inBacklog: true },
    data: { inBacklog: false, dayDate, status: "open" },
  });
  invalidate(userId);
  return success("Added to today");
}

export async function deleteTodo(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  if (!id) return failure("Invalid todo");
  await prisma.todo.updateMany({
    where: { id, userId },
    data: { deletedAt: new Date() },
  });
  invalidate(userId);
  return success("Todo deleted");
}

export async function restoreTodo(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  if (!id) return failure("Invalid todo");
  await prisma.todo.updateMany({
    where: { id, userId },
    data: { deletedAt: null },
  });
  invalidate(userId);
  return success("Todo restored");
}

export async function moveUnfinishedToBacklog(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const dayDate = startOfDay(parseDate(formData.get("dayDate")));
  await prisma.todo.updateMany({
    where: {
      userId,
      deletedAt: null,
      inBacklog: false,
      status: "open",
      dayDate: { gte: dayDate, lte: endOfDay(dayDate) },
    },
    data: { inBacklog: true },
  });
  invalidate(userId);
  return success("Open todos moved to backlog");
}

export async function moveAllStaleToBacklog(): Promise<ActionResult> {
  const userId = await getUserId();
  const today = startOfDay(new Date());
  const result = await prisma.todo.updateMany({
    where: {
      userId,
      deletedAt: null,
      inBacklog: false,
      status: "open",
      dayDate: { lt: today },
    },
    data: { inBacklog: true },
  });
  invalidate(userId);
  if (result.count === 0) return success("No stale todos to move");
  return success(`Moved ${result.count} todo${result.count === 1 ? "" : "s"} to backlog`);
}

export const pullFromBacklogForm = wrapFormAction(pullFromBacklog, "Added to today");
export const moveUnfinishedToBacklogForm = wrapFormAction(moveUnfinishedToBacklog, "Moved to backlog");
export const moveAllStaleToBacklogForm = wrapFormAction(moveAllStaleToBacklog, "Moved to backlog");
