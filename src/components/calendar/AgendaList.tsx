"use client";

import type { EventOccurrence } from "@/lib/calendar/types";
import { formatOccurrenceDay, formatOccurrenceTime } from "@/lib/calendar/format";
import EmptyState from "@/components/EmptyState";
import Icon from "@/components/Icon";

type ReminderChip = { id: string; title: string; remindAt: Date };

type Props = {
  timezone: string;
  occurrences: EventOccurrence[];
  reminders: ReminderChip[];
  onSelectOccurrence: (occ: EventOccurrence) => void;
  onSelectReminder: (id: string) => void;
  onCreate: () => void;
};

type Row =
  | { kind: "event"; sort: number; occ: EventOccurrence }
  | { kind: "reminder"; sort: number; rem: ReminderChip };

export default function AgendaList({
  timezone,
  occurrences,
  reminders,
  onSelectOccurrence,
  onSelectReminder,
  onCreate,
}: Props) {
  const rows: Row[] = [
    ...occurrences.map((occ) => ({ kind: "event" as const, sort: occ.startsAt.getTime(), occ })),
    ...reminders.map((rem) => ({ kind: "reminder" as const, sort: rem.remindAt.getTime(), rem })),
  ].sort((a, b) => a.sort - b.sort);

  if (rows.length === 0) {
    return (
      <EmptyState
        icon="calendar"
        title="No upcoming items"
        description="Create an event or a standalone reminder to get started."
        actionLabel="New event"
        onAction={onCreate}
        tip="Tip: use “Repeat” for birthdays and weekly meetings."
      />
    );
  }

  const groups: { label: string; rows: Row[] }[] = [];
  for (const row of rows) {
    const label = formatOccurrenceDay(row.kind === "event" ? row.occ.startsAt : row.rem.remindAt, timezone);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.rows.push(row);
    else groups.push({ label, rows: [row] });
  }

  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <section key={group.label}>
          <h3 className="eyebrow mb-2">{group.label}</h3>
          <ul className="card-flush divide-y divide-slate-100 dark:divide-slate-700">
            {group.rows.map((row) =>
              row.kind === "event" ? (
                <li key={`${row.occ.eventId}-${row.occ.originalStartsAt.toISOString()}`}>
                  <button
                    type="button"
                    onClick={() => onSelectOccurrence(row.occ)}
                    className="flex w-full items-start gap-4 px-4 py-3 text-left transition hover:bg-slate-50 dark:hover:bg-slate-700/40"
                  >
                    <span className="w-24 shrink-0 pt-0.5 text-sm tabular-nums text-brand-700 dark:text-brand-300">
                      {formatOccurrenceTime(row.occ.startsAt, row.occ.endsAt, row.occ.allDay, timezone)}
                    </span>
                    <span className="min-w-0 flex-1 font-medium text-slate-900 dark:text-slate-100">{row.occ.title}</span>
                  </button>
                </li>
              ) : (
                <li key={`${row.rem.id}-${row.rem.remindAt.toISOString()}`}>
                  <button
                    type="button"
                    onClick={() => onSelectReminder(row.rem.id)}
                    className="flex w-full items-start gap-4 px-4 py-3 text-left transition hover:bg-slate-50 dark:hover:bg-slate-700/40"
                  >
                    <span className="flex w-24 shrink-0 items-center gap-1.5 pt-0.5 text-sm tabular-nums text-amber-700 dark:text-amber-300">
                      <Icon name="bell" className="h-4 w-4" />
                      {row.rem.remindAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: timezone })}
                    </span>
                    <span className="min-w-0 flex-1 font-medium text-slate-900 dark:text-slate-100">{row.rem.title}</span>
                    <span className="badge-warning shrink-0">Reminder</span>
                  </button>
                </li>
              )
            )}
          </ul>
        </section>
      ))}
    </div>
  );
}
