import { startOfDay } from "@/lib/date";

export type GoalPeriod = "weekly" | "monthly" | "yearly";

/** ISO week key, e.g. 2026-W26 */
export function getWeekKey(d: Date): string {
  const date = startOfDay(d);
  const thursday = new Date(date);
  thursday.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const yearStart = new Date(thursday.getFullYear(), 0, 1);
  const week = Math.ceil(((thursday.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${thursday.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

/** Month key, e.g. 2026-06 */
export function getMonthKey(d: Date): string {
  const date = startOfDay(d);
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${date.getFullYear()}-${m}`;
}

/** Year key, e.g. 2026 */
export function getYearKey(d: Date): string {
  return String(startOfDay(d).getFullYear());
}

export function getPeriodKey(period: GoalPeriod, d: Date): string {
  if (period === "weekly") return getWeekKey(d);
  if (period === "monthly") return getMonthKey(d);
  return getYearKey(d);
}

export function periodLabel(period: GoalPeriod, key: string): string {
  if (period === "weekly") return `Week ${key.split("-W")[1]}, ${key.split("-W")[0]}`;
  if (period === "monthly") {
    const [y, m] = key.split("-");
    const month = new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-GB", { month: "long" });
    return `${month} ${y}`;
  }
  return key;
}

/** Shift reference date by N periods (negative = past). */
export function shiftPeriodDate(period: GoalPeriod, offset: number, ref = new Date()): Date {
  const d = new Date(ref);
  if (period === "weekly") {
    d.setDate(d.getDate() + offset * 7);
    return d;
  }
  if (period === "monthly") {
    d.setMonth(d.getMonth() + offset);
    return d;
  }
  d.setFullYear(d.getFullYear() + offset);
  return d;
}
