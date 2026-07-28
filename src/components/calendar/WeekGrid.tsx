"use client";

import clsx from "clsx";
import type { EventOccurrence } from "@/lib/calendar/types";
import { formatOccurrenceTime, occurrenceDayKey, weekDays } from "@/lib/calendar/format";
import { toDateInputValue } from "@/lib/date";

type ReminderChip = { id: string; title: string; remindAt: Date };

type Props = {
  weekStart: Date;
  timezone: string;
  occurrences: EventOccurrence[];
  reminders: ReminderChip[];
  onSelectOccurrence: (occ: EventOccurrence) => void;
  onSelectReminder: (id: string) => void;
  onCreateAt: (day: Date) => void;
};

export default function WeekGrid({
  weekStart,
  timezone,
  occurrences,
  reminders,
  onSelectOccurrence,
  onSelectReminder,
  onCreateAt,
}: Props) {
  const days = weekDays(weekStart);
  const todayKey = toDateInputValue(new Date());

  return (
    <div className="card grid grid-cols-1 gap-3 p-3 sm:grid-cols-7 sm:gap-2 sm:p-2">
      {days.map((day) => {
        const key = toDateInputValue(day);
        const dayOccs = occurrences.filter((o) => occurrenceDayKey(o.startsAt, timezone) === key);
        const dayRems = reminders.filter((r) => toDateInputValue(r.remindAt) === key);
        const isToday = key === todayKey;

        return (
          <div
            key={key}
            className={clsx(
              "min-h-[8rem] rounded-lg border border-slate-100 p-2 dark:border-slate-800",
              isToday && "border-brand-300 bg-brand-50/30 dark:border-brand-800 dark:bg-brand-950/20"
            )}
          >
            <button
              type="button"
              className="mb-2 flex w-full items-center justify-between text-left"
              onClick={() => onCreateAt(day)}
            >
              <span className="text-xs font-medium text-slate-500">
                {day.toLocaleDateString("en-GB", { weekday: "short" })}
              </span>
              <span
                className={clsx(
                  "text-sm font-semibold",
                  isToday && "text-brand-700 dark:text-brand-300"
                )}
              >
                {day.getDate()}
              </span>
            </button>
            <div className="space-y-1">
              {dayOccs.map((occ) => (
                <button
                  key={`${occ.eventId}-${occ.originalStartsAt.toISOString()}`}
                  type="button"
                  onClick={() => onSelectOccurrence(occ)}
                  className="block w-full truncate rounded bg-brand-100 px-1.5 py-1 text-left text-[11px] text-brand-900 dark:bg-brand-900 dark:text-brand-100"
                >
                  <span className="block opacity-70">
                    {formatOccurrenceTime(occ.startsAt, occ.endsAt, occ.allDay, timezone)}
                  </span>
                  {occ.title}
                </button>
              ))}
              {dayRems.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => onSelectReminder(r.id)}
                  className="block w-full truncate rounded bg-amber-100 px-1.5 py-1 text-left text-[11px] text-amber-900 dark:bg-amber-950 dark:text-amber-100"
                >
                  {r.title}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
