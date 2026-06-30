import { prisma } from "@/lib/db";
import { cacheTag, cachedQuery } from "@/lib/cache";
import { startOfDay, endOfDay } from "@/lib/date";

export type TodoItem = {
  id: string;
  title: string;
  status: string;
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
        orderBy: [{ status: "asc" }, { createdAt: "asc" }],
        select: { id: true, title: true, status: true },
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
        orderBy: { createdAt: "asc" },
        select: { id: true, title: true, status: true },
      })
  );
}
