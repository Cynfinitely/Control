"use client";

import type { EventOccurrence } from "@/lib/calendar/types";
import { formatOccurrenceTime, occurrenceDayKey } from "@/lib/calendar/format";
import { toDateInputValue } from "@/lib/date";
import EmptyState from "@/components/EmptyState";

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
  const key = toDateInputValue(day);
  const dayOccs = occurrences.filter((o) => occurrenceDayKey(o.startsAt, timezone) === key);
  const dayRems = reminders.filter((r) => toDateInputValue(r.remindAt) === key);

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
    <div className="space-y-2">
      {dayOccs.map((occ) => (
        <button
          key={`${occ.eventId}-${occ.originalStartsAt.toISOString()}`}
          type="button"
          onClick={() => onSelectOccurrence(occ)}
          className="card flex w-full items-start gap-3 text-left transition hover:border-brand-300"
        >
          <div className="w-20 shrink-0 text-xs font-medium text-brand-700 dark:text-brand-300">
            {formatOccurrenceTime(occ.startsAt, occ.endsAt, occ.allDay, timezone)}
          </div>
          <div>
            <p className="font-medium text-slate-900 dark:text-slate-100">{occ.title}</p>
            {occ.location && <p className="text-xs text-slate-500">{occ.location}</p>}
            {occ.isRecurring && <p className="mt-0.5 text-[10px] text-slate-400">Recurring</p>}
          </div>
        </button>
      ))}
      {dayRems.map((r) => (
        <button
          key={r.id}
          type="button"
          onClick={() => onSelectReminder(r.id)}
          className="card flex w-full items-start gap-3 border-amber-200 text-left dark:border-amber-900"
        >
          <div className="w-20 shrink-0 text-xs font-medium text-amber-700">Reminder</div>
          <p className="font-medium text-slate-900 dark:text-slate-100">{r.title}</p>
        </button>
      ))}
    </div>
  );
}
