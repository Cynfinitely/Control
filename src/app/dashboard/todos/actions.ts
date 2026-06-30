"use server";

import { prisma } from "@/lib/db";
import { getUserId, str, parseDate, parseOptionalDate } from "@/lib/actions";
import { revalidateUserCache } from "@/lib/cache";
import { startOfDay, endOfDay } from "@/lib/date";

function invalidate(userId: string) {
  revalidateUserCache(userId, "todos", "dashboard");
}

export async function createTodo(formData: FormData) {
  const userId = await getUserId();
  const title = str(formData.get("title"));
  if (!title) return;
  const dayDate = startOfDay(parseDate(formData.get("dayDate")));
  const priority = str(formData.get("priority")) || "medium";
  const category = str(formData.get("category")) || null;
  const dueDate = parseOptionalDate(formData.get("dueDate"));
  await prisma.todo.create({
    data: { userId, title, dayDate, inBacklog: false, priority, category, dueDate },
  });
  invalidate(userId);
}

export async function toggleTodo(formData: FormData) {
  const userId = await getUserId();
  const id = str(formData.get("id"));
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
}

export async function moveToBacklog(formData: FormData) {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  await prisma.todo.updateMany({
    where: { id, userId, status: "open" },
    data: { inBacklog: true },
  });
  invalidate(userId);
}

export async function pullFromBacklog(formData: FormData) {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  const dayDate = startOfDay(parseDate(formData.get("dayDate")));
  await prisma.todo.updateMany({
    where: { id, userId, inBacklog: true },
    data: { inBacklog: false, dayDate, status: "open" },
  });
  invalidate(userId);
}

export async function deleteTodo(formData: FormData) {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  await prisma.todo.updateMany({
    where: { id, userId },
    data: { deletedAt: new Date() },
  });
  invalidate(userId);
}

export async function moveUnfinishedToBacklog(formData: FormData) {
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
}
