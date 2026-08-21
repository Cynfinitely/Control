import { prisma } from "@/lib/db";
import { cacheTag, cachedQuery } from "@/lib/cache";

export type LifePriorityItem = {
  id: string;
  title: string;
  note: string | null;
  sortOrder: number;
};

export async function getLifePriorities(userId: string): Promise<LifePriorityItem[]> {
  return cachedQuery(
    ["life-priorities", userId],
    [cacheTag("priorities", userId)],
    () =>
      prisma.lifePriority.findMany({
        where: { userId },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: { id: true, title: true, note: true, sortOrder: true },
      })
  );
}
