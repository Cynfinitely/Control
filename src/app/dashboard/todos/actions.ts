"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getUserId, str, parseDate, parseOptionalDate } from "@/lib/actions";
import { revalidateUserCache } from "@/lib/cache";
import { startOfDay, endOfDay, formatDate } from "@/lib/date";
import {
  success,
  failure,
  wrapFormAction,
  type ActionResult,
} from "@/lib/action-result";

function invalidate(userId: string) {
  revalidateUserCache(userId, "todos", "dashboard", "plan");
  revalidatePath("/dashboard/todos");
  revalidatePath("/dashboard");
}

/** Custom order slot after the day's last todo, so new arrivals go to the end. */
async function nextPosition(userId: string, dayDate: Date) {
  const last = await prisma.todo.findFirst({
    where: {
      userId,
      deletedAt: null,
      inBacklog: false,
      dayDate: { gte: startOfDay(dayDate), lte: endOfDay(dayDate) },
    },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  return (last?.position ?? -1) + 1;
}

export async function createTodo(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const title = str(formData.get("title"));
  if (!title) return failure("Title is required");
  const dayDate = startOfDay(parseDate(formData.get("dayDate")));
  const priority = str(formData.get("priority")) || "medium";
  const category = str(formData.get("category")) || null;
  const dueDate = parseOptionalDate(formData.get("dueDate"));
  const inBacklog = str(formData.get("destination")) === "backlog";
  const position = inBacklog ? 0 : await nextPosition(userId, dayDate);
  await prisma.todo.create({
    data: {
      userId,
      title,
      dayDate,
      inBacklog,
      priority,
      category,
      dueDate,
      position,
    },
  });
  invalidate(userId);
  return success(inBacklog ? "Added to backlog" : "Todo added");
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

export async function pullFromBacklog(
  formData: FormData
): Promise<ActionResult> {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  if (!id) return failure("Invalid todo");
  const dayDate = startOfDay(parseDate(formData.get("dayDate")));
  const position = await nextPosition(userId, dayDate);
  await prisma.todo.updateMany({
    where: { id, userId, inBacklog: true },
    data: { inBacklog: false, dayDate, status: "open", position },
  });
  invalidate(userId);
  const isToday = dayDate.getTime() === startOfDay(new Date()).getTime();
  return success(
    isToday ? "Added to today" : `Added to ${formatDate(dayDate)}`
  );
}

const reorderSchema = z.array(z.string().min(1).max(64)).min(1).max(500);

/** Saves a custom order: each id's position becomes its index in `ids`. */
export async function reorderTodos(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const parsed = reorderSchema.safeParse(formData.getAll("ids"));
  if (!parsed.success) return failure("Invalid order");
  await prisma.$transaction(
    parsed.data.map((id, position) =>
      prisma.todo.updateMany({ where: { id, userId }, data: { position } })
    )
  );
  invalidate(userId);
  return success();
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
  return success(
    `Moved ${result.count} todo${result.count === 1 ? "" : "s"} to backlog`
  );
}
