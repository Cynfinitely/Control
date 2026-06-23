"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getUserId, str, optStr, parseOptionalDate } from "@/lib/actions";

export async function createTodo(formData: FormData) {
  const userId = await getUserId();
  const title = str(formData.get("title"));
  if (!title) return;
  await prisma.todo.create({
    data: {
      userId,
      title,
      notes: optStr(formData.get("notes")),
      category: optStr(formData.get("category")),
      priority: str(formData.get("priority")) || "medium",
      dueDate: parseOptionalDate(formData.get("dueDate")),
    },
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

export async function deleteTodo(formData: FormData) {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  await prisma.todo.updateMany({
    where: { id, userId },
    data: { deletedAt: new Date() },
  });
  revalidatePath("/dashboard/todos");
}
