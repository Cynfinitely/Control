"use client";

import { useOptimistic, useTransition } from "react";
import { setPrayer } from "./actions";

const PRAYERS = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

type PrayerStatus = Record<string, string | undefined>;

type Props = {
  dayValue: string;
  initialStatuses: PrayerStatus;
};

export default function PrayerStatusPanel({ dayValue, initialStatuses }: Props) {
  const [isPending, startTransition] = useTransition();
  const [statuses, setOptimistic] = useOptimistic(
    initialStatuses,
    (current, update: { prayer: string; status: string }) => ({
      ...current,
      [update.prayer]: update.status,
    })
  );

  function handleSetPrayer(prayer: string, status: string) {
    startTransition(async () => {
      setOptimistic({ prayer, status });
      const fd = new FormData();
      fd.set("prayer", prayer);
      fd.set("status", status);
      fd.set("date", dayValue);
      await setPrayer(fd);
    });
  }

  return (
    <div className={`space-y-4 ${isPending ? "opacity-80" : ""}`}>
      {PRAYERS.map((p) => {
        const current = statuses[p];
        return (
          <div key={p} className="flex flex-wrap items-center gap-3">
            <span className="w-20 font-medium capitalize text-slate-700 dark:text-slate-100">{p}</span>
            <div className="flex gap-2">
              {(["ontime", "missed"] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  disabled={isPending}
                  onClick={() => handleSetPrayer(p, status)}
                  className={`touch-target px-4 py-2 text-sm disabled:opacity-50 ${
                    current === status
                      ? status === "ontime"
                        ? "badge-success ring-2 ring-offset-1 ring-green-300 dark:ring-offset-slate-900"
                        : "badge-danger ring-2 ring-offset-1 ring-red-300 dark:ring-offset-slate-900"
                      : "badge bg-white text-slate-500 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700 dark:hover:bg-slate-700"
                  }`}
                >
                  {status === "ontime" ? "On time" : "Missed"}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
