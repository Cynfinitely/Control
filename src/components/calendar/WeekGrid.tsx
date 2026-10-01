"use client";

import clsx from "clsx";
import type { EventOccurrence } from "@/lib/calendar/types";
import { dayKey, formatOccurrenceTime, occurrenceDayKey, weekDays } from "@/lib/calendar/format";
import Icon from "@/components/Icon";

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
  const todayKey = occurrenceDayKey(new Date(), timezone);

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-7 md:gap-2">
      {days.map((day) => {
        const key = dayKey(day);
        const dayOccs = occurrences.filter((o) => occurrenceDayKey(o.startsAt, timezone) === key);
        const dayRems = reminders.filter((r) => occurrenceDayKey(r.remindAt, timezone) === key);
        const isToday = key === todayKey;
        const dateLabel = day.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

        return (
          <section
            key={key}
            aria-label={isToday ? `${dateLabel} (today)` : dateLabel}
            className={clsx(
              "flex min-h-[8rem] flex-col rounded-xl border bg-white p-2 dark:bg-slate-800",
              isToday ? "border-brand-400 dark:border-brand-700" : "border-slate-200 dark:border-slate-700"
            )}
          >
            <div className="mb-2 flex items-center justify-between gap-1">
              <h3 className="flex items-baseline gap-1.5">
                <span className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                  {day.toLocaleDateString("en-GB", { weekday: "short" })}
                </span>
                <span
                  className={clsx(
                    "inline-flex h-6 min-w-6 items-center justify-center rounded-full text-sm font-semibold",
                    isToday ? "bg-brand-600 px-1.5 text-white" : "text-slate-900 dark:text-slate-100"
                  )}
                >
                  {day.getDate()}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => onCreateAt(day)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-brand-700 dark:hover:bg-slate-700"
                aria-label={`New event on ${dateLabel}`}
                title="New event"
              >
                <Icon name="plus" className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-1">
              {dayOccs.map((occ) => (
                <button
                  key={`${occ.eventId}-${occ.originalStartsAt.toISOString()}`}
                  type="button"
                  onClick={() => onSelectOccurrence(occ)}
                  className="block w-full rounded-md bg-brand-100 px-2 py-1.5 text-left text-xs text-brand-900 hover:bg-brand-200 dark:bg-brand-900 dark:text-brand-100 dark:hover:bg-brand-800"
                >
                  <span className="block text-[11px] opacity-80">
                    {formatOccurrenceTime(occ.startsAt, occ.endsAt, occ.allDay, timezone)}
                  </span>
                  <span className="block truncate font-medium">{occ.title}</span>
                </button>
              ))}
              {dayRems.map((r) => (
                <button
                  key={`${r.id}-${r.remindAt.toISOString()}`}
                  type="button"
                  onClick={() => onSelectReminder(r.id)}
                  className="flex w-full items-center gap-1.5 rounded-md bg-amber-100 px-2 py-1.5 text-left text-xs text-amber-900 hover:bg-amber-200 dark:bg-amber-950 dark:text-amber-100"
                >
                  <Icon name="bell" className="h-3.5 w-3.5 shrink-0" />
                  <span className="sr-only">Reminder:</span>
                  <span className="truncate">{r.title}</span>
                </button>
              ))}
              {dayOccs.length === 0 && dayRems.length === 0 && (
                <p className="px-1 text-xs text-slate-500 dark:text-slate-400 md:sr-only">Nothing scheduled</p>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
