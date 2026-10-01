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

export type RruleParts = {
  freq: RruleBuilderInput["freq"] | "NONE";
  interval: number;
  /** ISO weekdays 0=Mon..6=Sun */
  byweekday: number[];
  until: Date | null;
};

const FREQ_FROM_RRULE: Partial<Record<Frequency, RruleBuilderInput["freq"]>> = {
  [RRule.DAILY]: "DAILY",
  [RRule.WEEKLY]: "WEEKLY",
  [RRule.MONTHLY]: "MONTHLY",
  [RRule.YEARLY]: "YEARLY",
};

/** Decompose a stored RRULE back into the editor's fields (inverse of buildRruleString). */
export function parseRruleParts(rrule: string | null | undefined): RruleParts {
  const empty: RruleParts = { freq: "NONE", interval: 1, byweekday: [], until: null };
  if (!rrule) return empty;
  try {
    const rule = rrulestr(rrule.startsWith("RRULE:") ? rrule : `RRULE:${rrule}`);
    const orig = rule.origOptions;
    const freq = orig.freq !== undefined ? FREQ_FROM_RRULE[orig.freq] : undefined;
    if (!freq) return empty;
    const rawDays = orig.byweekday === undefined || orig.byweekday === null
      ? []
      : Array.isArray(orig.byweekday)
        ? orig.byweekday
        : [orig.byweekday];
    const byweekday = rawDays
      .map((d) => (typeof d === "number" ? d : typeof d === "string" ? null : d.weekday))
      .filter((d): d is number => typeof d === "number" && d >= 0 && d <= 6)
      .sort((a, b) => a - b);
    return {
      freq,
      interval: orig.interval && orig.interval > 0 ? orig.interval : 1,
      byweekday,
      until: orig.until ?? null,
    };
  } catch {
    return empty;
  }
}

/** Human-readable summary, e.g. "every 2 weeks on Monday, Wednesday". */
export function describeRrule(rrule: string | null | undefined): string {
  if (!rrule) return "";
  try {
    return rrulestr(rrule.startsWith("RRULE:") ? rrule : `RRULE:${rrule}`).toText();
  } catch {
    return "";
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
