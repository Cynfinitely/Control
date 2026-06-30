import { prisma } from "@/lib/db";
import { cacheTag, cachedQuery } from "@/lib/cache";
import { startOfDay, endOfDay } from "@/lib/date";

export async function getDayFoodEntries(userId: string, dayKey: string) {
  const day = new Date(dayKey + "T00:00:00");
  return cachedQuery(
    ["food-day", userId, dayKey],
    [cacheTag("food", userId), cacheTag("dashboard", userId)],
    async () => {
      const [entries, target, waterAgg] = await Promise.all([
        prisma.foodLogEntry.findMany({
          where: {
            userId,
            deletedAt: null,
            date: { gte: startOfDay(day), lte: endOfDay(day) },
          },
          orderBy: { createdAt: "asc" },
        }),
        prisma.nutritionTarget.findUnique({ where: { userId } }),
        prisma.waterLog.aggregate({
          where: { userId, date: { gte: startOfDay(day), lte: endOfDay(day) } },
          _sum: { glasses: true },
        }),
      ]);
      return {
        entries,
        target,
        waterGlasses: waterAgg._sum.glasses ?? 0,
      };
    }
  );
}
