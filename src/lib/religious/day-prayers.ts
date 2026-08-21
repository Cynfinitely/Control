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
