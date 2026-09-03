import { prisma } from "@/lib/db";
import { cacheTag, cachedQuery } from "@/lib/cache";
import { coerceDate, endOfDay, startOfDay, toDateInputValue } from "@/lib/date";
import { monthGridDays } from "@/lib/calendar/format";

export type MigraineDayLog = {
  date: string;
  pain: number;
  durationMin: number | null;
  note: string | null;
};

export async function getMonthMigraineLogs(userId: string, monthKey: string): Promise<MigraineDayLog[]> {
  const days = monthGridDays(monthKey);
  const from = startOfDay(days[0]!);
  const to = endOfDay(days[days.length - 1]!);

  return cachedQuery(
    ["migraine-month", userId, monthKey],
    [cacheTag("migraine", userId)],
    async () => {
      const rows = await prisma.migraineLog.findMany({
        where: { userId, date: { gte: from, lte: to } },
        orderBy: { date: "asc" },
        select: { date: true, pain: true, durationMin: true, note: true },
      });
      return rows.map((row) => ({
        date: toDateInputValue(coerceDate(row.date)),
        pain: row.pain,
        durationMin: row.durationMin,
        note: row.note,
      }));
    }
  );
}
