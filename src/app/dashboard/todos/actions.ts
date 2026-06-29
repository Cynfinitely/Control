"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getUserId, str, parseDate } from "@/lib/actions";
import { startOfDay, endOfDay } from "@/lib/date";

export async function createTodo(formData: FormData) {
  const userId = await getUserId();
  const title = str(formData.get("title"));
  if (!title) return;
  const dayDate = startOfDay(parseDate(formData.get("dayDate")));
  await prisma.todo.create({
    data: { userId, title, dayDate, inBacklog: false },
  });
  revalidatePath("/dashboard/todos");
}

export async function toggleTodo(formData: FormData) {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  const todo = await prisma.todo.findFirst({ where: { id, userId } });
  if (!todo) return;
  const done = todo.status !== "done";
  await prisma.todo.update({
    where: { id },
    data: { status: done ? "done" : "open", completedAt: done ? new Date() : null },
  });
  revalidatePath("/dashboard/todos");
}

export async function moveToBacklog(formData: FormData) {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  await prisma.todo.updateMany({
    where: { id, userId, status: "open" },
    data: { inBacklog: true },
  });
  revalidatePath("/dashboard/todos");
}

export async function pullFromBacklog(formData: FormData) {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  const dayDate = startOfDay(parseDate(formData.get("dayDate")));
  await prisma.todo.updateMany({
    where: { id, userId, inBacklog: true },
    data: { inBacklog: false, dayDate, status: "open" },
  });
  revalidatePath("/dashboard/todos");
}

export async function deleteTodo(formData: FormData) {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  await prisma.todo.updateMany({
    where: { id, userId },
    data: { deletedAt: new Date() },
  });
  revalidatePath("/dashboard/todos");
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
  revalidatePath("/dashboard/todos");
}
