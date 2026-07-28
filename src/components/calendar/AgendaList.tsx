"use client";

import type { EventOccurrence } from "@/lib/calendar/types";
import { formatOccurrenceDay, formatOccurrenceTime } from "@/lib/calendar/format";
import EmptyState from "@/components/EmptyState";

type ReminderChip = { id: string; title: string; remindAt: Date };

type Props = {
  timezone: string;
  occurrences: EventOccurrence[];
  reminders: ReminderChip[];
  onSelectOccurrence: (occ: EventOccurrence) => void;
  onSelectReminder: (id: string) => void;
  onCreate: () => void;
};

export default function AgendaList({
  timezone,
  occurrences,
  reminders,
  onSelectOccurrence,
  onSelectReminder,
  onCreate,
}: Props) {
  type Row =
    | { kind: "event"; sort: number; occ: EventOccurrence }
    | { kind: "reminder"; sort: number; rem: ReminderChip };

  const rows: Row[] = [
    ...occurrences.map((occ) => ({
      kind: "event" as const,
      sort: occ.startsAt.getTime(),
      occ,
    })),
    ...reminders.map((rem) => ({
      kind: "reminder" as const,
      sort: rem.remindAt.getTime(),
      rem,
    })),
  ].sort((a, b) => a.sort - b.sort);

  if (rows.length === 0) {
    return (
      <EmptyState
        icon="calendar"
        title="No upcoming items"
        description="Create an event or a standalone reminder to get started."
        actionLabel="New event"
        onAction={onCreate}
        tip="Tip: use recurrence for birthdays and weekly meetings."
      />
    );
  }

  let lastDay = "";

  return (
    <div className="space-y-2">
      {rows.map((row) => {
        const dayLabel =
          row.kind === "event"
            ? formatOccurrenceDay(row.occ.startsAt, timezone)
            : formatOccurrenceDay(row.rem.remindAt, timezone);
        const showHeader = dayLabel !== lastDay;
        lastDay = dayLabel;

        return (
          <div key={row.kind === "event" ? `${row.occ.eventId}-${row.occ.originalStartsAt.toISOString()}` : row.rem.id}>
            {showHeader && (
              <p className="mb-1 mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400 first:mt-0">
                {dayLabel}
              </p>
            )}
            {row.kind === "event" ? (
              <button
                type="button"
                onClick={() => onSelectOccurrence(row.occ)}
                className="card flex w-full items-start gap-3 text-left"
              >
                <span className="w-24 shrink-0 text-xs text-brand-700 dark:text-brand-300">
                  {formatOccurrenceTime(row.occ.startsAt, row.occ.endsAt, row.occ.allDay, timezone)}
                </span>
                <span className="font-medium">{row.occ.title}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onSelectReminder(row.rem.id)}
                className="card flex w-full items-start gap-3 border-amber-200 text-left dark:border-amber-900"
              >
                <span className="w-24 shrink-0 text-xs text-amber-700">Reminder</span>
                <span className="font-medium">{row.rem.title}</span>
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
