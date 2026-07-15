import { prisma } from "@/lib/db";
import { cacheTag, cachedQuery } from "@/lib/cache";
import { startOfDay, endOfDay } from "@/lib/date";

export type TodoItem = {
  id: string;
  title: string;
  status: string;
  priority: string;
  category: string | null;
  dueDate: Date | null;
};

export async function getDayTodos(userId: string, dayKey: string) {
  const day = new Date(dayKey + "T00:00:00");
  return cachedQuery(
    ["todos-day", userId, dayKey],
    [cacheTag("todos", userId)],
    () =>
      prisma.todo.findMany({
        where: {
          userId,
          deletedAt: null,
          inBacklog: false,
          dayDate: { gte: startOfDay(day), lte: endOfDay(day) },
        },
        orderBy: [{ status: "asc" }, { priority: "desc" }, { createdAt: "asc" }],
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          category: true,
          dueDate: true,
        },
      })
  );
}

export async function getBacklogTodos(userId: string) {
  return cachedQuery(
    ["todos-backlog", userId],
    [cacheTag("todos", userId)],
    () =>
      prisma.todo.findMany({
        where: { userId, deletedAt: null, inBacklog: true, status: "open" },
        orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          category: true,
          dueDate: true,
        },
      })
  );
}

function staleOpenWhere(userId: string) {
  const today = startOfDay(new Date());
  return {
    userId,
    deletedAt: null,
    inBacklog: false,
    status: "open" as const,
    dayDate: { lt: today },
  };
}

export async function getStaleOpenTodoCount(userId: string) {
  const todayKey = startOfDay(new Date()).toISOString().slice(0, 10);
  return cachedQuery(
    ["todos-stale", userId, todayKey],
    [cacheTag("todos", userId)],
    () => prisma.todo.count({ where: staleOpenWhere(userId) })
  );
}

export async function getOverdueTodoCount(userId: string) {
  const today = startOfDay(new Date());
  return cachedQuery(
    ["todos-overdue", userId, today.toISOString().slice(0, 10)],
    [cacheTag("todos", userId)],
    () =>
      prisma.todo.count({
        where: {
          userId,
          deletedAt: null,
          status: "open",
          dueDate: { lt: today },
        },
      })
  );
}
