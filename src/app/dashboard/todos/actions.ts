"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getUserId, str, parseDate, parseOptionalDate } from "@/lib/actions";
import { revalidateUserCache } from "@/lib/cache";
import { startOfDay, endOfDay, formatDate } from "@/lib/date";
import {
  MAX_CATEGORY_LENGTH,
  MAX_TITLE_LENGTH,
  PRIORITIES,
  TIME_SLOTS,
  normalizeCategory,
  parsePriority,
  parseQuickAdd,
  parseTimeSlot,
} from "@/lib/todo-meta";
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
  const quick = parseQuickAdd(str(formData.get("title")));
  const title = quick.title.slice(0, MAX_TITLE_LENGTH);
  if (!title) return failure("Title is required");
  const dayDate = startOfDay(parseDate(formData.get("dayDate")));
  // Tokens typed in the title (!high #health @after) beat the form fields.
  const priority = quick.priority ?? parsePriority(formData.get("priority"));
  const category =
    quick.category ?? normalizeCategory(formData.get("category"));
  const timeSlot =
    quick.timeSlot !== undefined
      ? quick.timeSlot
      : parseTimeSlot(formData.get("timeSlot"));
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
      timeSlot,
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

const slotSchema = z
  .union([
    z.enum(Object.keys(TIME_SLOTS) as [keyof typeof TIME_SLOTS]),
    z.literal(""),
  ])
  .transform(v => v || null);

const updateSchema = z.object({
  id: z.string().min(1).max(64),
  title: z.string().trim().min(1, "Title is required").max(MAX_TITLE_LENGTH),
  priority: z.enum(Object.keys(PRIORITIES) as [keyof typeof PRIORITIES]),
  category: z
    .string()
    .max(MAX_CATEGORY_LENGTH * 2)
    .transform(v => normalizeCategory(v)),
  timeSlot: slotSchema,
  dueDate: z.string().max(32),
});

/** Saves edits to a todo's title, priority, category, slot and due date. */
export async function updateTodo(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const parsed = updateSchema.safeParse({
    id: str(formData.get("id")),
    title: str(formData.get("title")),
    priority: str(formData.get("priority")) || "medium",
    category: str(formData.get("category")),
    timeSlot: str(formData.get("timeSlot")),
    dueDate: str(formData.get("dueDate")),
  });
  if (!parsed.success) {
    return failure(parsed.error.issues[0]?.message ?? "Invalid todo");
  }
  const { id, dueDate, ...data } = parsed.data;
  const result = await prisma.todo.updateMany({
    where: { id, userId, deletedAt: null },
    data: { ...data, dueDate: parseOptionalDate(dueDate) },
  });
  if (result.count === 0) return failure("Todo not found");
  invalidate(userId);
  return success("Todo updated");
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
