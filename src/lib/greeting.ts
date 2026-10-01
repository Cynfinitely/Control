/** Home page helpers: greeting and date in the user's timezone, weekly-review nudge rule. */

export function greetingForHour(hour: number, name: string) {
  if (hour < 12) return `Good morning, ${name}`;
  if (hour < 17) return `Good afternoon, ${name}`;
  return `Good evening, ${name}`;
}

function safeZone(timeZone: string | null | undefined): string | undefined {
  if (!timeZone) return undefined;
  try {
    new Intl.DateTimeFormat("en-GB", { timeZone });
    return timeZone;
  } catch {
    return undefined;
  }
}

/** Hour (0–23) of `date` in `timeZone`; falls back to the server zone for invalid zones. */
export function hourInZone(date: Date, timeZone: string | null | undefined): number {
  const zone = safeZone(timeZone);
  const part = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hourCycle: "h23", timeZone: zone })
    .formatToParts(date)
    .find((p) => p.type === "hour");
  const hour = Number(part?.value);
  return Number.isNaN(hour) ? date.getHours() : hour % 24;
}

/** ISO weekday (1 = Monday … 7 = Sunday) of `date` in `timeZone`. */
export function isoWeekdayInZone(date: Date, timeZone: string | null | undefined): number {
  const zone = safeZone(timeZone);
  const short = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: zone }).format(date);
  const index = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(short);
  return index === -1 ? ((date.getDay() + 6) % 7) + 1 : index + 1;
}

/** "Thursday, 1 October 2026" in `timeZone`. */
export function formatLongDateInZone(date: Date, timeZone: string | null | undefined): string {
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: safeZone(timeZone),
  });
}

/**
 * Show the "weekly review not done" nudge when this week's review isn't complete and
 * either it's the end of the week (Fri–Sun) or last week's started review was never finished.
 */
export function shouldNudgeWeeklyReview({
  isoWeekday,
  thisWeekCompleted,
  lastWeekStartedNotCompleted,
}: {
  isoWeekday: number;
  thisWeekCompleted: boolean;
  lastWeekStartedNotCompleted: boolean;
}): boolean {
  if (thisWeekCompleted) return false;
  return isoWeekday >= 5 || lastWeekStartedNotCompleted;
}
