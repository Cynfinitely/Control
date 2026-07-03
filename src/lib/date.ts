export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export function startOfWeek(d: Date): Date {
  const x = startOfDay(d);
  const day = (x.getDay() + 6) % 7; // Monday = 0
  x.setDate(x.getDate() - day);
  return x;
}

export function startOfMonth(d: Date): Date {
  const x = startOfDay(d);
  x.setDate(1);
  return x;
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function rangeFor(period: "daily" | "weekly" | "monthly", ref = new Date()) {
  if (period === "daily") return { from: startOfDay(ref), to: endOfDay(ref) };
  if (period === "weekly") {
    const from = startOfWeek(ref);
    return { from, to: endOfDay(addDays(from, 6)) };
  }
  const from = startOfMonth(ref);
  const to = endOfDay(addDays(new Date(ref.getFullYear(), ref.getMonth() + 1, 0), 0));
  return { from, to };
}

export function toDateInputValue(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "";
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 10);
}

export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "-";
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDayLabel(d: Date): string {
  const today = startOfDay(new Date());
  const day = startOfDay(d);
  if (day.getTime() === today.getTime()) return "Today";
  const yesterday = addDays(today, -1);
  if (day.getTime() === yesterday.getTime()) return "Yesterday";
  return formatDate(day);
}

export function formatDaysAgo(d: Date | string | null | undefined): string {
  if (!d) return "Never";
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "Never";
  const today = startOfDay(new Date());
  const day = startOfDay(date);
  const diff = Math.round((today.getTime() - day.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff} days ago`;
  if (diff < 30) return `${Math.floor(diff / 7)} week${Math.floor(diff / 7) === 1 ? "" : "s"} ago`;
  return formatDate(day);
}

export function parseDayParam(value: string | undefined): Date {
  if (!value) return startOfDay(new Date());
  const d = new Date(value + "T00:00:00");
  return isNaN(d.getTime()) ? startOfDay(new Date()) : startOfDay(d);
}

export function endOfMonth(d: Date): Date {
  return endOfDay(new Date(d.getFullYear(), d.getMonth() + 1, 0));
}

export function parseMonthParam(value: string | undefined, fallback?: Date): Date {
  if (value && /^\d{4}-\d{2}$/.test(value)) {
    const [y, m] = value.split("-").map(Number);
    return startOfMonth(new Date(y, m - 1, 1));
  }
  return startOfMonth(fallback ?? new Date());
}

export function toMonthKey(d: Date): string {
  const x = startOfDay(d);
  const m = String(x.getMonth() + 1).padStart(2, "0");
  return `${x.getFullYear()}-${m}`;
}
