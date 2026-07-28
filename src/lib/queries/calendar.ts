import { prisma } from "@/lib/db";
import { cacheTag, cachedQuery } from "@/lib/cache";
import { coerceDate } from "@/lib/date";
import { expandEventOccurrences } from "@/lib/calendar";
import type { EventOccurrence } from "@/lib/calendar/types";

function reviveException(e: {
  originalStartsAt: Date | string;
  cancelled: boolean;
  title: string | null;
  description: string | null;
  location: string | null;
  allDay: boolean | null;
  startsAt: Date | string | null;
  endsAt: Date | string | null;
}) {
  return {
    originalStartsAt: coerceDate(e.originalStartsAt),
    cancelled: e.cancelled,
    title: e.title,
    description: e.description,
    location: e.location,
    allDay: e.allDay,
    startsAt: e.startsAt ? coerceDate(e.startsAt) : null,
    endsAt: e.endsAt ? coerceDate(e.endsAt) : null,
  };
}

export async function getEventsInRange(userId: string, rangeStart: Date, rangeEnd: Date) {
  return cachedQuery(
    ["calendar-events", userId, rangeStart.toISOString(), rangeEnd.toISOString()],
    [cacheTag("calendar", userId)],
    async () => {
      const events = await prisma.calendarEvent.findMany({
        where: {
          userId,
          deletedAt: null,
          status: "confirmed",
          OR: [
            {
              rrule: null,
              startsAt: { lte: rangeEnd },
              endsAt: { gte: rangeStart },
            },
            {
              rrule: { not: null },
              startsAt: { lte: rangeEnd },
              OR: [{ rruleUntil: null }, { rruleUntil: { gte: rangeStart } }],
            },
          ],
        },
        include: {
          exceptions: true,
          reminders: {
            where: { deletedAt: null, status: "active" },
            select: {
              id: true,
              title: true,
              offsetMinutes: true,
              remindAt: true,
              status: true,
            },
          },
        },
        orderBy: { startsAt: "asc" },
      });

      return events.map((e) => ({
        ...e,
        startsAt: coerceDate(e.startsAt),
        endsAt: coerceDate(e.endsAt),
        rruleUntil: e.rruleUntil ? coerceDate(e.rruleUntil) : null,
        exceptions: e.exceptions.map(reviveException),
      }));
    }
  );
}

export async function getOccurrencesInRange(
  userId: string,
  rangeStart: Date,
  rangeEnd: Date
): Promise<EventOccurrence[]> {
  const events = await getEventsInRange(userId, rangeStart, rangeEnd);
  const occs: EventOccurrence[] = [];
  for (const event of events) {
    occs.push(
      ...expandEventOccurrences(
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
        event.exceptions,
        rangeStart,
        rangeEnd
      )
    );
  }
  occs.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  return occs;
}

export async function getCalendarEvent(userId: string, eventId: string) {
  const event = await prisma.calendarEvent.findFirst({
    where: { id: eventId, userId, deletedAt: null },
    include: {
      exceptions: true,
      reminders: { where: { deletedAt: null }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!event) return null;
  return {
    ...event,
    startsAt: coerceDate(event.startsAt),
    endsAt: coerceDate(event.endsAt),
    rruleUntil: event.rruleUntil ? coerceDate(event.rruleUntil) : null,
    exceptions: event.exceptions.map(reviveException),
    reminders: event.reminders.map((r) => ({
      ...r,
      remindAt: r.remindAt ? coerceDate(r.remindAt) : null,
    })),
  };
}

export async function getStandaloneReminders(userId: string, rangeStart: Date, rangeEnd: Date) {
  return cachedQuery(
    ["calendar-reminders", userId, rangeStart.toISOString(), rangeEnd.toISOString()],
    [cacheTag("calendar", userId)],
    async () => {
      const reminders = await prisma.reminder.findMany({
        where: {
          userId,
          deletedAt: null,
          status: "active",
          eventId: null,
          OR: [
            { remindAt: { gte: rangeStart, lte: rangeEnd } },
            { rrule: { not: null }, remindAt: { lte: rangeEnd } },
          ],
        },
        orderBy: { remindAt: "asc" },
      });
      return reminders.map((r) => ({
        ...r,
        remindAt: r.remindAt ? coerceDate(r.remindAt) : null,
      }));
    }
  );
}

export async function getReminder(userId: string, reminderId: string) {
  const r = await prisma.reminder.findFirst({
    where: { id: reminderId, userId, deletedAt: null },
  });
  if (!r) return null;
  return { ...r, remindAt: r.remindAt ? coerceDate(r.remindAt) : null };
}

export async function getNotifications(userId: string, limit = 30) {
  const rows = await prisma.notification.findMany({
    where: { userId },
    orderBy: [{ readAt: "asc" }, { dueAt: "desc" }],
    take: limit,
  });
  return rows.map((n) => ({
    ...n,
    dueAt: coerceDate(n.dueAt),
    readAt: n.readAt ? coerceDate(n.readAt) : null,
    createdAt: coerceDate(n.createdAt),
  }));
}

export async function getUnreadNotificationCount(userId: string) {
  return prisma.notification.count({
    where: { userId, readAt: null },
  });
}
