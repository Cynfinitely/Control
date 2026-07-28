import { RRule, Frequency, Weekday, rrulestr } from "rrule";
import { DateTime } from "luxon";
import type { RruleBuilderInput } from "./types";

const FREQ_MAP: Record<RruleBuilderInput["freq"], Frequency> = {
  DAILY: RRule.DAILY,
  WEEKLY: RRule.WEEKLY,
  MONTHLY: RRule.MONTHLY,
  YEARLY: RRule.YEARLY,
};

/** ISO weekday 0=Mon..6=Sun → rrule Weekday */
const ISO_TO_RRULE: Weekday[] = [
  RRule.MO,
  RRule.TU,
  RRule.WE,
  RRule.TH,
  RRule.FR,
  RRule.SA,
  RRule.SU,
];

export function buildRruleString(input: RruleBuilderInput): string {
  const options: Partial<ConstructorParameters<typeof RRule>[0]> = {
    freq: FREQ_MAP[input.freq],
    interval: input.interval && input.interval > 0 ? input.interval : 1,
  };
  if (input.byweekday?.length) {
    options.byweekday = input.byweekday.map((d) => ISO_TO_RRULE[d]!);
  }
  if (input.bymonthday?.length) {
    options.bymonthday = input.bymonthday;
  }
  if (input.count && input.count > 0) {
    options.count = input.count;
  }
  if (input.until) {
    options.until = input.until;
  }
  return new RRule(options as ConstructorParameters<typeof RRule>[0]).toString().replace(
    /^RRULE:/,
    ""
  );
}

export function parseRruleUntil(rrule: string | null | undefined): Date | null {
  if (!rrule) return null;
  try {
    const rule = rrulestr(rrule.startsWith("RRULE:") ? rrule : `RRULE:${rrule}`);
    return rule.options.until ?? null;
  } catch {
    return null;
  }
}

/**
 * Expand RRULE occurrence starts in [rangeStart, rangeEnd].
 * DTSTART is the master's startsAt interpreted in the event timezone.
 */
export function expandRruleStarts(
  rrule: string,
  dtstart: Date,
  timezone: string,
  rangeStart: Date,
  rangeEnd: Date
): Date[] {
  const localStart = DateTime.fromJSDate(dtstart, { zone: "utc" }).setZone(timezone);
  const floating = new Date(
    Date.UTC(
      localStart.year,
      localStart.month - 1,
      localStart.day,
      localStart.hour,
      localStart.minute,
      localStart.second
    )
  );

  const rule = rrulestr(rrule.startsWith("RRULE:") ? rrule : `RRULE:${rrule}`, {
    dtstart: floating,
  });

  const rangeStartFloating = DateTime.fromJSDate(rangeStart, { zone: "utc" })
    .setZone(timezone)
    .toUTC()
    .toJSDate();
  // Use a slightly expanded window so timezone edge cases don't drop boundary days
  const padStart = new Date(rangeStartFloating.getTime() - 2 * 86400000);
  const padEnd = new Date(rangeEnd.getTime() + 2 * 86400000);

  const dates = rule.between(padStart, padEnd, true);

  return dates
    .map((d) => {
      const wall = DateTime.fromObject(
        {
          year: d.getUTCFullYear(),
          month: d.getUTCMonth() + 1,
          day: d.getUTCDate(),
          hour: d.getUTCHours(),
          minute: d.getUTCMinutes(),
          second: d.getUTCSeconds(),
        },
        { zone: timezone }
      );
      return wall.toUTC().toJSDate();
    })
    .filter((d) => d >= rangeStart && d <= rangeEnd);
}

export function durationMs(startsAt: Date, endsAt: Date): number {
  return Math.max(0, endsAt.getTime() - startsAt.getTime());
}

/** Truncate a series: UNTIL just before the given occurrence (exclusive). */
export function rruleUntilBefore(originalStartsAt: Date): Date {
  return new Date(originalStartsAt.getTime() - 1000);
}
