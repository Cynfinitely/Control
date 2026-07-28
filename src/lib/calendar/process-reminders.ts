import { prisma } from "@/lib/db";
import { expandEventOccurrences, computeDueReminders } from "@/lib/calendar";
import type { EventOccurrence } from "@/lib/calendar/types";
import type { ReminderForDue } from "@/lib/calendar/reminders";
import { addDays } from "@/lib/date";

/**
 * Scan due reminders for all users (or one user) and insert Notifications.
 * Safe to run repeatedly — uses unique dedupeKey.
 */
export async function processDueReminders(opts?: { userId?: string; now?: Date }) {
  const now = opts?.now ?? new Date();
  const lookback = addDays(now, -2);
  const lookahead = addDays(now, 2);

  const users = await prisma.user.findMany({
    where: opts?.userId ? { id: opts.userId } : undefined,
    select: { id: true, timezone: true },
  });

  let created = 0;

  for (const user of users) {
    const [standalone, attachedReminders, events] = await Promise.all([
      prisma.reminder.findMany({
        where: {
          userId: user.id,
          deletedAt: null,
          status: "active",
          eventId: null,
          OR: [
            { remindAt: { lte: now, gte: lookback } },
            { rrule: { not: null }, remindAt: { lte: now } },
          ],
        },
      }),
      prisma.reminder.findMany({
        where: {
          userId: user.id,
          deletedAt: null,
          status: "active",
          eventId: { not: null },
          offsetMinutes: { not: null },
        },
      }),
      prisma.calendarEvent.findMany({
        where: {
          userId: user.id,
          deletedAt: null,
          status: "confirmed",
          OR: [
            {
              rrule: null,
              startsAt: { lte: lookahead },
              endsAt: { gte: lookback },
            },
            {
              rrule: { not: null },
              startsAt: { lte: lookahead },
              OR: [{ rruleUntil: null }, { rruleUntil: { gte: lookback } }],
            },
          ],
        },
        include: { exceptions: true },
      }),
    ]);

    const eventById = new Map(events.map((e) => [e.id, e]));

    const attached: Array<{ reminder: ReminderForDue; occurrences: EventOccurrence[] }> = [];

    for (const reminder of attachedReminders) {
      const event = reminder.eventId ? eventById.get(reminder.eventId) : null;
      if (!event) continue;
      const occurrences = expandEventOccurrences(
        {
          id: event.id,
          title: event.title,
          description: event.description,
          location: event.location,
          allDay: event.allDay,
          startsAt: event.startsAt,
          endsAt: event.endsAt,
          timezone: event.timezone,
          rrule: event.rrule,
          rruleUntil: event.rruleUntil,
          status: event.status,
        },
        event.exceptions.map((ex) => ({
          originalStartsAt: ex.originalStartsAt,
          cancelled: ex.cancelled,
          title: ex.title,
          description: ex.description,
          location: ex.location,
          allDay: ex.allDay,
          startsAt: ex.startsAt,
          endsAt: ex.endsAt,
        })),
        lookback,
        lookahead
      );
      attached.push({
        reminder: {
          id: reminder.id,
          title: reminder.title,
          eventId: reminder.eventId,
          remindAt: reminder.remindAt,
          offsetMinutes: reminder.offsetMinutes,
          rrule: reminder.rrule,
          status: reminder.status,
        },
        occurrences,
      });
    }

    const candidates = computeDueReminders({
      now,
      timezone: user.timezone,
      standalone: standalone.map((r) => ({
        id: r.id,
        title: r.title,
        eventId: r.eventId,
        remindAt: r.remindAt,
        offsetMinutes: r.offsetMinutes,
        rrule: r.rrule,
        status: r.status,
      })),
      attached,
    });

    for (const c of candidates) {
      if (c.dueAt < lookback) continue;
      try {
        await prisma.notification.create({
          data: {
            userId: user.id,
            title: c.title,
            body: c.sourceType === "event" ? "Upcoming event reminder" : "Reminder",
            dueAt: c.dueAt,
            sourceType: c.sourceType,
            sourceId: c.sourceId,
            dedupeKey: c.dedupeKey,
            href: c.href,
          },
        });
        created += 1;
      } catch {
        // Unique constraint = already notified
      }
    }
  }

  return { created, users: users.length };
}
