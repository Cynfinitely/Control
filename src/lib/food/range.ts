import {
  addDays,
  endOfDay,
  endOfMonth,
  formatDate,
  parseDayParam,
  parseMonthParam,
  startOfDay,
  startOfMonth,
  startOfWeek,
  toDateInputValue,
  toMonthKey,
} from "@/lib/date";

export type FoodRangePreset =
  | "7d"
  | "14d"
  | "week"
  | "last-week"
  | "month"
  | "last-month"
  | "custom";

export type FoodRangeSearchParams = {
  range?: string;
  from?: string;
  to?: string;
  anchor?: string;
};

export type FoodRange = {
  preset: FoodRangePreset;
  from: Date;
  to: Date;
  label: string;
  anchor: string;
};

const VALID_PRESETS = new Set<FoodRangePreset>([
  "7d",
  "14d",
  "week",
  "last-week",
  "month",
  "last-month",
  "custom",
]);

function datedRange(preset: FoodRangePreset, from: Date, to: Date, anchor: string): FoodRange {
  return {
    preset,
    from,
    to,
    label: `${formatDate(from)} – ${formatDate(to)}`,
    anchor,
  };
}

export function parseFoodRange(searchParams: FoodRangeSearchParams, now = new Date()): FoodRange {
  const preset: FoodRangePreset = VALID_PRESETS.has(searchParams.range as FoodRangePreset)
    ? (searchParams.range as FoodRangePreset)
    : "7d";

  if (preset === "7d" || preset === "14d") {
    const daysBack = preset === "7d" ? 6 : 13;
    const to = endOfDay(now);
    const from = startOfDay(addDays(now, -daysBack));
    return datedRange(preset, from, to, toDateInputValue(now));
  }

  if (preset === "week" || preset === "last-week") {
    const ref =
      preset === "last-week"
        ? addDays(startOfDay(now), -7)
        : searchParams.anchor
          ? parseDayParam(searchParams.anchor)
          : startOfDay(now);
    const from = startOfWeek(ref);
    const to = endOfDay(addDays(from, 6));
    return datedRange(preset, from, to, toDateInputValue(from));
  }

  if (preset === "month" || preset === "last-month") {
    const ref =
      preset === "last-month"
        ? startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1))
        : parseMonthParam(searchParams.anchor, now);
    const from = startOfMonth(ref);
    const to = endOfMonth(from);
    return datedRange(preset, from, to, toMonthKey(from));
  }

  const fromDay = searchParams.from ? parseDayParam(searchParams.from) : startOfDay(now);
  const toDay = searchParams.to
    ? parseDayParam(searchParams.to)
    : searchParams.from
      ? parseDayParam(searchParams.from)
      : startOfDay(now);
  let from = startOfDay(fromDay);
  let to = endOfDay(toDay);
  if (from.getTime() > to.getTime()) {
    const swappedFrom = startOfDay(to);
    to = endOfDay(from);
    from = swappedFrom;
  }
  return datedRange("custom", from, to, toDateInputValue(from));
}

export function shiftFoodRange(range: FoodRange, offset: number): Partial<FoodRangeSearchParams> {
  if (range.preset === "week" || range.preset === "last-week") {
    return { range: "week", anchor: toDateInputValue(addDays(range.from, offset * 7)) };
  }
  if (range.preset === "month" || range.preset === "last-month") {
    const [year, month] = range.anchor.split("-").map(Number);
    const ref = new Date(year, month - 1 + offset, 1);
    return { range: "month", anchor: toMonthKey(ref) };
  }
  return {};
}

export function buildFoodReportUrl(
  basePath: string,
  params: FoodRangeSearchParams,
  updates: Partial<FoodRangeSearchParams> = {}
): string {
  const merged = { ...params, ...updates };
  const qs = new URLSearchParams();
  const range = merged.range && merged.range !== "7d" ? merged.range : undefined;

  if (range) qs.set("range", range);
  if ((range === "week" || range === "month") && merged.anchor) qs.set("anchor", merged.anchor);
  if (range === "custom") {
    if (merged.from) qs.set("from", merged.from);
    if (merged.to) qs.set("to", merged.to);
  }

  const query = qs.toString();
  return query ? `${basePath}?${query}` : basePath;
}
