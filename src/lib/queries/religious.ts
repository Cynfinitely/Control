import { prisma } from "@/lib/db";
import { cacheTag, cachedQuery } from "@/lib/cache";
import { startOfDay, endOfDay, addDays, toDateInputValue, coerceDate } from "@/lib/date";

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

function reviveOptionalDate(d: Date | string | null): Date | null {
  return d ? coerceDate(d) : null;
}

export async function getReligiousSidebarData(userId: string, todayKey: string) {
  const today = new Date(todayKey + "T00:00:00");
  const now = new Date();
  // cachedQuery JSON-serializes results, so Dates come back as strings on cache
  // hits. Revive them after the await (see getEventsInRange in calendar.ts).
  const data = await cachedQuery(
    ["religious-sidebar", userId, todayKey],
    [cacheTag("religious", userId)],
    async () => {
      const [pendingQaza, prayerDebts, dhikr, quran, fasts, dhikrTargets, quranState, readingItems, readingEntries] =
        await Promise.all([
        prisma.qazaPrayer.findMany({
          where: { userId, fulfilledAt: null },
          orderBy: [{ sourceDate: "asc" }, { prayer: "asc" }],
        }),
        prisma.prayerDebt.findMany({ where: { userId }, orderBy: { prayer: "asc" } }),
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
        prisma.quranState.findUnique({ where: { userId } }),
        prisma.dailyReadingItem.findMany({ where: { userId }, orderBy: { sortOrder: "asc" } }),
        prisma.dailyReadingEntry.findMany({
          where: { userId, date: { gte: today, lte: endOfDay(now) } },
        }),
      ]);
      return {
        pendingQaza,
        prayerDebts,
        dhikr,
        quran,
        fasts,
        dhikrTargets,
        quranState,
        readingItems,
        readingEntries,
      };
    }
  );
  return {
    ...data,
    pendingQaza: data.pendingQaza.map((q) => ({
      ...q,
      sourceDate: reviveOptionalDate(q.sourceDate),
      fulfilledAt: reviveOptionalDate(q.fulfilledAt),
      createdAt: coerceDate(q.createdAt),
    })),
    prayerDebts: data.prayerDebts.map((d) => ({
      ...d,
      periodStart: reviveOptionalDate(d.periodStart),
      periodEnd: reviveOptionalDate(d.periodEnd),
      createdAt: coerceDate(d.createdAt),
      updatedAt: coerceDate(d.updatedAt),
    })),
    dhikr: data.dhikr.map((d) => ({ ...d, date: coerceDate(d.date), createdAt: coerceDate(d.createdAt) })),
    quran: data.quran.map((q) => ({ ...q, date: coerceDate(q.date), createdAt: coerceDate(q.createdAt) })),
    fasts: data.fasts.map((f) => ({ ...f, date: coerceDate(f.date), createdAt: coerceDate(f.createdAt) })),
    readingEntries: data.readingEntries.map((e) => ({ ...e, date: coerceDate(e.date), createdAt: coerceDate(e.createdAt) })),
  };
}
