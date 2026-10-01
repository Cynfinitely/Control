import { PRAYERS } from "@/lib/prayer-debt";

export type DayPrayerSummary = {
  onTime: number;
  missed: number;
  unlogged: number;
  total: number;
};

/** Last status for each canonical prayer wins. Unlogged prayers are not on time. */
export function summarizeDayPrayers(
  logs: { prayer: string; status: string }[]
): DayPrayerSummary {
  const byPrayer = new Map<string, string>();
  for (const log of logs) {
    byPrayer.set(log.prayer, log.status);
  }

  let onTime = 0;
  let missed = 0;
  for (const prayer of PRAYERS) {
    const status = byPrayer.get(prayer);
    if (status === "ontime") onTime += 1;
    else if (status === "missed") missed += 1;
  }

  return {
    onTime,
    missed,
    unlogged: PRAYERS.length - onTime - missed,
    total: PRAYERS.length,
  };
}

const PRAYER_LABELS: Record<string, string> = {
  fajr: "Fajr",
  dhuhr: "Dhuhr",
  asr: "Asr",
  maghrib: "Maghrib",
  isha: "Isha",
};

/** Display name for a prayer key ("fajr" → "Fajr"). */
export function prayerLabel(prayer: string): string {
  return PRAYER_LABELS[prayer] ?? prayer.charAt(0).toUpperCase() + prayer.slice(1);
}

export type PrayerStatusValue = "ontime" | "missed";

/** Prayers "Mark all on time" would fill: only those without any status yet. */
export function prayersToMarkOnTime(statuses: Record<string, string | null | undefined>): string[] {
  return PRAYERS.filter((p) => !statuses[p]);
}

export type QazaGroup<T> = {
  prayer: string;
  count: number;
  /** Oldest first (the order "Fulfill one" uses). */
  items: T[];
  oldest: Date | string | null;
  newest: Date | string | null;
};

/** Group pending daily qaza by prayer in canonical prayer order, oldest first. */
export function groupPendingQaza<T extends { prayer: string; sourceDate: Date | string | null }>(
  pending: readonly T[]
): QazaGroup<T>[] {
  const time = (d: Date | string | null) => (d ? new Date(d).getTime() : Number.NEGATIVE_INFINITY);
  return PRAYERS.map((prayer) => {
    const items = pending
      .filter((q) => q.prayer === prayer)
      .slice()
      .sort((a, b) => time(a.sourceDate) - time(b.sourceDate));
    return {
      prayer,
      count: items.length,
      items,
      oldest: items[0]?.sourceDate ?? null,
      newest: items[items.length - 1]?.sourceDate ?? null,
    };
  }).filter((g) => g.count > 0);
}
