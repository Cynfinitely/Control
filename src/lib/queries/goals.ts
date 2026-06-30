import { prisma } from "@/lib/db";
import { cacheTag, cachedQuery } from "@/lib/cache";
import type { GoalPeriod } from "@/lib/period";

export type GoalItem = {
  id: string;
  title: string;
  type: string;
  targetValue: number | null;
  currentValue: number;
  status: string;
};

export async function getGoalsForPeriod(userId: string, period: GoalPeriod, periodKey: string) {
  return cachedQuery(
    ["goals", userId, period, periodKey],
    [cacheTag("goals", userId)],
    () =>
      prisma.goal.findMany({
        where: { userId, deletedAt: null, period, periodKey },
        orderBy: [{ status: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          title: true,
          type: true,
          targetValue: true,
          currentValue: true,
          status: true,
        },
      })
  );
}
