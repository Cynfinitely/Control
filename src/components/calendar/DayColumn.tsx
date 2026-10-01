"use client";

import type { EventOccurrence } from "@/lib/calendar/types";
import { dayKey, formatOccurrenceTime, occurrenceDayKey } from "@/lib/calendar/format";
import EmptyState from "@/components/EmptyState";
import Icon from "@/components/Icon";

type ReminderChip = { id: string; title: string; remindAt: Date };

type Props = {
  day: Date;
  timezone: string;
  occurrences: EventOccurrence[];
  reminders: ReminderChip[];
  onSelectOccurrence: (occ: EventOccurrence) => void;
  onSelectReminder: (id: string) => void;
  onCreate: () => void;
};

export default function DayColumn({
  day,
  timezone,
  occurrences,
  reminders,
  onSelectOccurrence,
  onSelectReminder,
  onCreate,
}: Props) {
  const key = dayKey(day);
  const dayOccs = occurrences.filter((o) => occurrenceDayKey(o.startsAt, timezone) === key);
  const dayRems = reminders.filter((r) => occurrenceDayKey(r.remindAt, timezone) === key);

  if (dayOccs.length === 0 && dayRems.length === 0) {
    return (
      <EmptyState
        icon="calendar"
        title="Nothing scheduled"
        description="Add an event or reminder for this day."
        actionLabel="New event"
        onAction={onCreate}
      />
    );
  }

  return (
    <ul className="card-flush divide-y divide-slate-100 dark:divide-slate-700">
      {dayOccs.map((occ) => (
        <li key={`${occ.eventId}-${occ.originalStartsAt.toISOString()}`}>
          <button
            type="button"
            onClick={() => onSelectOccurrence(occ)}
            className="flex w-full items-start gap-4 px-4 py-3 text-left transition hover:bg-slate-50 dark:hover:bg-slate-700/40"
          >
            <span className="w-24 shrink-0 pt-0.5 text-sm font-medium tabular-nums text-brand-700 dark:text-brand-300">
              {formatOccurrenceTime(occ.startsAt, occ.endsAt, occ.allDay, timezone)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-medium text-slate-900 dark:text-slate-100">{occ.title}</span>
              {occ.location && <span className="block text-sm text-slate-600 dark:text-slate-400">{occ.location}</span>}
            </span>
            {occ.isRecurring && <span className="badge-muted shrink-0">Repeats</span>}
          </button>
        </li>
      ))}
      {dayRems.map((r) => (
        <li key={`${r.id}-${r.remindAt.toISOString()}`}>
          <button
            type="button"
            onClick={() => onSelectReminder(r.id)}
            className="flex w-full items-start gap-4 px-4 py-3 text-left transition hover:bg-slate-50 dark:hover:bg-slate-700/40"
          >
            <span className="flex w-24 shrink-0 items-center gap-1.5 pt-0.5 text-sm font-medium tabular-nums text-amber-700 dark:text-amber-300">
              <Icon name="bell" className="h-4 w-4" />
              {r.remindAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: timezone })}
            </span>
            <span className="min-w-0 flex-1 font-medium text-slate-900 dark:text-slate-100">{r.title}</span>
            <span className="badge-warning shrink-0">Reminder</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
