"use client";

import clsx from "clsx";
import type { EventOccurrence } from "@/lib/calendar/types";
import { dayKey, monthGridDays, occurrenceDayKey } from "@/lib/calendar/format";
import Icon from "@/components/Icon";

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

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MAX_CHIPS = 3;

function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

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
  const todayKey = occurrenceDayKey(new Date(), timezone);

  const byDay = new Map<string, EventOccurrence[]>();
  for (const occ of occurrences) {
    const k = occurrenceDayKey(occ.startsAt, timezone);
    const list = byDay.get(k) ?? [];
    list.push(occ);
    byDay.set(k, list);
  }

  const remByDay = new Map<string, ReminderChip[]>();
  for (const r of reminders) {
    const k = occurrenceDayKey(r.remindAt, timezone);
    const list = remByDay.get(k) ?? [];
    list.push(r);
    remByDay.set(k, list);
  }

  return (
    <div className="card overflow-hidden p-0">
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-400" aria-hidden="true">
        {WEEKDAYS.map((d) => (
          <div key={d} className="px-0.5 py-2">
            <span className="sm:hidden">{d[0]}</span>
            <span className="hidden sm:inline">{d}</span>
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
          const shownOccs = dayOccs.slice(0, MAX_CHIPS);
          const shownRems = dayRems.slice(0, Math.max(0, MAX_CHIPS - shownOccs.length));
          const hidden = dayOccs.length + dayRems.length - shownOccs.length - shownRems.length;
          const dateLabel = day.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
          const summary = [
            isToday ? "Today" : null,
            dayOccs.length ? plural(dayOccs.length, "event") : null,
            dayRems.length ? plural(dayRems.length, "reminder") : null,
          ]
            .filter(Boolean)
            .join(", ");

          return (
            <div
              key={key}
              className={clsx(
                "group relative min-h-[3.5rem] border-b border-r border-slate-100 p-1 dark:border-slate-700/60 sm:min-h-[7rem]",
                !inMonth && "bg-slate-50/70 dark:bg-slate-950/40",
                isToday && "bg-brand-50/50 dark:bg-brand-950/20"
              )}
            >
              {/* Full-cell target: open the day. Chips below are siblings, not nested. */}
              <button
                type="button"
                onClick={() => onSelectDay(day)}
                aria-label={summary ? `${dateLabel} — ${summary}` : dateLabel}
                className="absolute inset-0 transition hover:bg-brand-50/60 focus-visible:z-20 dark:hover:bg-brand-950/30"
              />
              <div className="pointer-events-none relative flex items-center justify-between">
                <span
                  aria-hidden="true"
                  className={clsx(
                    "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                    isToday
                      ? "bg-brand-600 font-semibold text-white"
                      : inMonth
                        ? "text-slate-800 dark:text-slate-200"
                        : "text-slate-500 dark:text-slate-400"
                  )}
                >
                  {day.getDate()}
                </span>
                <button
                  type="button"
                  onClick={() => onCreateAt(day)}
                  className="pointer-events-auto relative z-10 hidden h-6 w-6 items-center justify-center rounded text-slate-500 opacity-0 transition hover:bg-brand-100 hover:text-brand-700 focus-visible:opacity-100 group-hover:opacity-100 dark:hover:bg-brand-900 sm:inline-flex"
                  aria-label={`New event on ${dateLabel}`}
                  title="New event"
                >
                  <Icon name="plus" className="h-4 w-4" />
                </button>
              </div>
              <div className="relative mt-0.5 hidden space-y-0.5 sm:block">
                {shownOccs.map((occ) => (
                  <button
                    key={`${occ.eventId}-${occ.originalStartsAt.toISOString()}`}
                    type="button"
                    onClick={() => onSelectOccurrence(occ)}
                    className="relative z-10 block w-full truncate rounded bg-brand-100 px-1.5 py-0.5 text-left text-xs text-brand-900 hover:bg-brand-200 dark:bg-brand-900 dark:text-brand-100 dark:hover:bg-brand-800"
                  >
                    {occ.title}
                  </button>
                ))}
                {shownRems.map((r) => (
                  <button
                    key={`${r.id}-${r.remindAt.toISOString()}`}
                    type="button"
                    onClick={() => onSelectReminder(r.id)}
                    className="relative z-10 flex w-full items-center gap-1 truncate rounded bg-amber-100 px-1.5 py-0.5 text-left text-xs text-amber-900 hover:bg-amber-200 dark:bg-amber-950 dark:text-amber-100"
                  >
                    <Icon name="bell" className="h-3 w-3 shrink-0" />
                    <span className="sr-only">Reminder:</span>
                    <span className="truncate">{r.title}</span>
                  </button>
                ))}
                {hidden > 0 && (
                  <button
                    type="button"
                    onClick={() => onSelectDay(day)}
                    className="relative z-10 rounded px-1 text-xs font-medium text-slate-600 hover:underline dark:text-slate-300"
                  >
                    +{hidden} more
                  </button>
                )}
              </div>
              <div className="pointer-events-none relative mt-1 flex gap-1 sm:hidden" aria-hidden="true">
                {dayOccs.length > 0 && <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />}
                {dayRems.length > 0 && <span className="h-1.5 w-1.5 rounded-sm bg-amber-500" />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
