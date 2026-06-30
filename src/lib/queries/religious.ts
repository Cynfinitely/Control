import { prisma } from "@/lib/db";
import { cacheTag, cachedQuery } from "@/lib/cache";
import { startOfDay, endOfDay, addDays, toDateInputValue } from "@/lib/date";

export async function getDayPrayers(userId: string, dayKey: string) {
  const day = new Date(dayKey + "T00:00:00");
  return cachedQuery(
    ["prayers-day", userId, dayKey],
    [cacheTag("religious", userId)],
    () =>
      prisma.prayerLog.findMany({
        where: { userId, date: { gte: startOfDay(day), lte: endOfDay(day) } },
        select: { prayer: true, status: true },
      })
  );
}

export async function getPrayerStreak(userId: string, todayKey: string) {
  const today = new Date(todayKey + "T00:00:00");
  return cachedQuery(
    ["prayer-streak", userId, todayKey],
    [cacheTag("religious", userId)],
    async () => {
      const onTimeByDay = await prisma.prayerLog.groupBy({
        by: ["date"],
        where: {
          userId,
          status: "ontime",
          date: { gte: addDays(today, -60) },
        },
        _count: { _all: true },
      });

      const byDayOnTime = new Map<string, number>();
      for (const row of onTimeByDay) {
        byDayOnTime.set(toDateInputValue(row.date), row._count._all);
      }

      let streak = 0;
      for (let i = 0; i < 60; i++) {
        const key = toDateInputValue(addDays(today, -i));
        if ((byDayOnTime.get(key) ?? 0) >= 5) streak++;
        else if (i === 0) continue;
        else break;
      }
      return streak;
    }
  );
}

export async function getReligiousSidebarData(userId: string, todayKey: string) {
  const today = new Date(todayKey + "T00:00:00");
  const now = new Date();
  return cachedQuery(
    ["religious-sidebar", userId, todayKey],
    [cacheTag("religious", userId)],
    async () => {
      const [pendingQaza, dhikr, quran, fasts, dhikrTargets] = await Promise.all([
        prisma.qazaPrayer.findMany({
          where: { userId, fulfilledAt: null },
          orderBy: [{ sourceDate: "asc" }, { prayer: "asc" }],
        }),
        prisma.dhikrLog.findMany({
          where: { userId, date: { gte: today, lte: endOfDay(now) } },
          orderBy: { createdAt: "desc" },
        }),
        prisma.quranProgress.findMany({
          where: { userId },
          orderBy: { date: "desc" },
          take: 7,
        }),
        prisma.fastingLog.findMany({
          where: { userId },
          orderBy: { date: "desc" },
          take: 7,
        }),
        prisma.dhikrTarget.findMany({ where: { userId }, orderBy: { name: "asc" } }),
      ]);
      return { pendingQaza, dhikr, quran, fasts, dhikrTargets };
    }
  );
}
