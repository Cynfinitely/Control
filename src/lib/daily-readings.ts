export type DailyReadingUnit = "pages" | "times";

export type SuggestedDailyReading = {
  name: string;
  unit: DailyReadingUnit;
  dailyTarget: number;
  linkKind: "quran" | null;
};

export const SUGGESTED_DAILY_READINGS: SuggestedDailyReading[] = [
  { name: "Quran", unit: "pages", dailyTarget: 5, linkKind: "quran" },
  { name: "Jawshan", unit: "times", dailyTarget: 5, linkKind: null },
  { name: "Risale-i Nur", unit: "pages", dailyTarget: 5, linkKind: null },
  { name: "Gülen", unit: "pages", dailyTarget: 5, linkKind: null },
];

export function readingProgress(logged: number, target: number): { pct: number; done: boolean } {
  if (target <= 0) return { pct: 0, done: false };
  const pct = Math.min(100, Math.round((logged / target) * 100));
  return { pct, done: logged >= target };
}

export function sumAmounts(entries: { amount: number }[]): number {
  return entries.reduce((sum, entry) => sum + entry.amount, 0);
}
