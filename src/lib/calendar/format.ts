import { DateTime } from "luxon";

export function toDatetimeLocalValue(d: Date, timezone?: string): string {
  const dt = timezone
    ? DateTime.fromJSDate(d, { zone: "utc" }).setZone(timezone)
    : DateTime.fromJSDate(d);
  return dt.toFormat("yyyy-MM-dd'T'HH:mm");
}

export function formatOccurrenceTime(startsAt: Date, endsAt: Date, allDay: boolean, timezone: string): string {
  if (allDay) return "All day";
  const s = DateTime.fromJSDate(startsAt, { zone: "utc" }).setZone(timezone);
  const e = DateTime.fromJSDate(endsAt, { zone: "utc" }).setZone(timezone);
  return `${s.toFormat("HH:mm")}–${e.toFormat("HH:mm")}`;
}

export function formatOccurrenceDay(d: Date, timezone: string): string {
  return DateTime.fromJSDate(d, { zone: "utc" }).setZone(timezone).toFormat("ccc d MMM");
}

export function monthGridDays(monthKey: string): Date[] {
  const [y, m] = monthKey.split("-").map(Number);
  const first = new Date(y!, m! - 1, 1);
  const startPad = (first.getDay() + 6) % 7; // Mon=0
  const start = new Date(y!, m! - 1, 1 - startPad);
  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    days.push(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  }
  return days;
}

export function weekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
}

export function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function occurrenceDayKey(startsAt: Date, timezone: string): string {
  return DateTime.fromJSDate(startsAt, { zone: "utc" }).setZone(timezone).toFormat("yyyy-MM-dd");
}
