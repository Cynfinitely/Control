import type { DueReminderCandidate, EventOccurrence } from "./types";
import { expandRruleStarts } from "./rrule";

export type ReminderForDue = {
  id: string;
  title: string | null;
  eventId: string | null;
  remindAt: Date | null;
  offsetMinutes: number | null;
  rrule: string | null;
  status: string;
  eventTitle?: string | null;
};

/**
 * Compute due reminder notification candidates up to `now`.
 * For attached reminders, pass already-expanded occurrences whose start is within
 * the lookahead window used by the caller.
 */
export function computeDueReminders(opts: {
  now: Date;
  standalone: ReminderForDue[];
  attached: Array<{
    reminder: ReminderForDue;
    occurrences: EventOccurrence[];
  }>;
  timezone?: string;
}): DueReminderCandidate[] {
  const { now, standalone, attached } = opts;
  const out: DueReminderCandidate[] = [];

  for (const rem of standalone) {
    if (rem.status !== "active") continue;

    if (rem.rrule && rem.remindAt) {
      const starts = expandRruleStarts(
        rem.rrule,
        rem.remindAt,
        opts.timezone ?? "UTC",
        new Date(0),
        now
      );
      for (const dueAt of starts) {
        if (dueAt > now) continue;
        out.push({
          reminderId: rem.id,
          eventId: null,
          title: rem.title || "Reminder",
          dueAt,
          dedupeKey: `reminder:${rem.id}:${dueAt.toISOString()}`,
          href: `/dashboard/calendar?reminder=${rem.id}`,
          sourceType: "reminder",
          sourceId: rem.id,
        });
      }
    } else if (rem.remindAt && rem.remindAt <= now) {
      out.push({
        reminderId: rem.id,
        eventId: null,
        title: rem.title || "Reminder",
        dueAt: rem.remindAt,
        dedupeKey: `reminder:${rem.id}:${rem.remindAt.toISOString()}`,
        href: `/dashboard/calendar?reminder=${rem.id}`,
        sourceType: "reminder",
        sourceId: rem.id,
      });
    }
  }

  for (const { reminder, occurrences } of attached) {
    if (reminder.status !== "active") continue;
    const offset = reminder.offsetMinutes ?? 0;
    for (const occ of occurrences) {
      const dueAt = new Date(occ.startsAt.getTime() - offset * 60_000);
      if (dueAt > now) continue;
      out.push({
        reminderId: reminder.id,
        eventId: occ.eventId,
        title: reminder.title || occ.title,
        dueAt,
        dedupeKey: `reminder:${reminder.id}:occ:${occ.originalStartsAt.toISOString()}`,
        href: `/dashboard/calendar?event=${occ.eventId}&at=${occ.originalStartsAt.toISOString()}`,
        sourceType: "event",
        sourceId: occ.eventId,
      });
    }
  }

  return out;
}
