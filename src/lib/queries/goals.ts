import { prisma } from "@/lib/db";
import { cacheTag, cachedQuery } from "@/lib/cache";
import type { GoalPeriod } from "@/lib/period";

export type GoalMilestoneItem = {
  id: string;
  title: string;
  done: boolean;
};

export type GoalCheckInItem = {
  id: string;
  value: number;
  note: string | null;
  date: Date;
};

export type GoalItem = {
  id: string;
  title: string;
  type: string;
  targetValue: number | null;
  currentValue: number;
  status: string;
  linkType: string | null;
  milestones: GoalMilestoneItem[];
  checkIns: GoalCheckInItem[];
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
          linkType: true,
          milestones: {
            orderBy: { createdAt: "asc" },
            select: { id: true, title: true, done: true },
          },
          checkIns: {
            orderBy: { date: "desc" },
            take: 5,
            select: { id: true, value: true, note: true, date: true },
          },
        },
      })
  );
}
