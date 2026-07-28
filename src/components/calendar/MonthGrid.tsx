"use client";

import clsx from "clsx";
import type { EventOccurrence } from "@/lib/calendar/types";
import { dayKey, monthGridDays, occurrenceDayKey } from "@/lib/calendar/format";
import { toDateInputValue } from "@/lib/date";

type ReminderChip = {
  id: string;
  title: string;
  remindAt: Date;
};

type Props = {
  monthKey: string;
  timezone: string;
  occurrences: EventOccurrence[];
  reminders: ReminderChip[];
  onSelectDay: (day: Date) => void;
  onSelectOccurrence: (occ: EventOccurrence) => void;
  onSelectReminder: (id: string) => void;
  onCreateAt: (day: Date) => void;
};

export default function MonthGrid({
  monthKey,
  timezone,
  occurrences,
  reminders,
  onSelectDay,
  onSelectOccurrence,
  onSelectReminder,
  onCreateAt,
}: Props) {
  const [y, m] = monthKey.split("-").map(Number);
  const days = monthGridDays(monthKey);
  const todayKey = toDateInputValue(new Date());

  const byDay = new Map<string, EventOccurrence[]>();
  for (const occ of occurrences) {
    const k = occurrenceDayKey(occ.startsAt, timezone);
    const list = byDay.get(k) ?? [];
    list.push(occ);
    byDay.set(k, list);
  }

  const remByDay = new Map<string, ReminderChip[]>();
  for (const r of reminders) {
    const k = dayKey(r.remindAt);
    const list = remByDay.get(k) ?? [];
    list.push(r);
    remByDay.set(k, list);
  }

  return (
    <div className="card overflow-hidden p-0">
      <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50 text-center text-xs font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-900/50">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="px-1 py-2">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const key = dayKey(day);
          const inMonth = day.getMonth() === m! - 1 && day.getFullYear() === y;
          const dayOccs = byDay.get(key) ?? [];
          const dayRems = remByDay.get(key) ?? [];
          const isToday = key === todayKey;

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectDay(day)}
              onDoubleClick={() => onCreateAt(day)}
              className={clsx(
                "min-h-[4.5rem] border-b border-r border-slate-100 p-1 text-left align-top transition hover:bg-brand-50/50 dark:border-slate-800 dark:hover:bg-brand-950/30 sm:min-h-[6.5rem]",
                !inMonth && "bg-slate-50/60 text-slate-400 dark:bg-slate-950/40",
                isToday && "bg-brand-50/40 dark:bg-brand-950/20"
              )}
            >
              <span
                className={clsx(
                  "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                  isToday && "bg-brand-600 text-white"
                )}
              >
                {day.getDate()}
              </span>
              <div className="mt-0.5 hidden space-y-0.5 sm:block">
                {dayOccs.slice(0, 3).map((occ) => (
                  <span
                    key={`${occ.eventId}-${occ.originalStartsAt.toISOString()}`}
                    role="presentation"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectOccurrence(occ);
                    }}
                    className="block truncate rounded bg-brand-100 px-1 text-[10px] text-brand-800 dark:bg-brand-900 dark:text-brand-200"
                  >
                    {occ.title}
                  </span>
                ))}
                {dayRems.slice(0, 2).map((r) => (
                  <span
                    key={r.id}
                    role="presentation"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectReminder(r.id);
                    }}
                    className="block truncate rounded bg-amber-100 px-1 text-[10px] text-amber-900 dark:bg-amber-950 dark:text-amber-200"
                  >
                    ⏱ {r.title}
                  </span>
                ))}
                {dayOccs.length + dayRems.length > 3 && (
                  <span className="text-[10px] text-slate-400">
                    +{dayOccs.length + dayRems.length - 3} more
                  </span>
                )}
              </div>
              <div className="mt-1 flex gap-0.5 sm:hidden">
                {dayOccs.length > 0 && <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />}
                {dayRems.length > 0 && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
