export const PRAYERS = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const;

export type PrayerName = (typeof PRAYERS)[number];

export function estimatePrayerDebtDays(periodStart: Date, periodEnd: Date): number {
  const start = new Date(periodStart);
  const end = new Date(periodEnd);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  if (end < start) return 0;
  return Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
}

export function historicalDebtRemaining(debts: { owed: number; fulfilled: number }[]): number {
  return debts.reduce((sum, d) => sum + Math.max(0, d.owed - d.fulfilled), 0);
}

export function prayerDebtRemaining(debt: { owed: number; fulfilled: number }): number {
  return Math.max(0, debt.owed - debt.fulfilled);
}
