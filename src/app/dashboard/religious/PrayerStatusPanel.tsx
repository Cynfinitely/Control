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
            <span className="w-20 font-medium capitalize text-slate-700">{p}</span>
            <div className="flex gap-2">
              {(["ontime", "missed"] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  disabled={isPending}
                  onClick={() => handleSetPrayer(p, status)}
                  className={`touch-target badge px-4 py-2 text-sm disabled:opacity-50 ${
                    current === status
                      ? status === "ontime"
                        ? "bg-green-100 text-green-700 ring-2 ring-offset-1 ring-green-300"
                        : "bg-red-100 text-red-700 ring-2 ring-offset-1 ring-red-300"
                      : "bg-white text-slate-500 ring-1 ring-inset ring-slate-200 hover:bg-slate-50"
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
