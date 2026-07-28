"use server";

import { prisma } from "@/lib/db";
import { getUserId, str, optStr } from "@/lib/actions";
import { revalidateUserCache } from "@/lib/cache";
import { parseRruleUntil, rruleUntilBefore } from "@/lib/calendar";
import type { OccurrenceScope } from "@/lib/calendar/types";

function invalidate(userId: string) {
  revalidateUserCache(userId, "calendar", "dashboard");
}

function parseBool(value: FormDataEntryValue | null): boolean {
  const s = String(value ?? "");
  return s === "true" || s === "on" || s === "1";
}

function parseOffsets(formData: FormData): number[] {
  const raw = str(formData.get("reminderOffsets"));
  if (!raw) return [];
  return raw
    .split(",")
    .map((x) => Number(x.trim()))
    .filter((n) => !Number.isNaN(n) && n >= 0);
}

function parseDateTimeLocal(value: FormDataEntryValue | null): Date | null {
  const s = str(value);
  if (!s) return null;
  // datetime-local: YYYY-MM-DDTHH:mm — treat as local wall, convert via Date
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function getUserTimezone(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { timezone: true },
  });
  return user?.timezone ?? "Europe/Istanbul";
}

export async function createEvent(formData: FormData) {
  const userId = await getUserId();
  const title = str(formData.get("title"));
  if (!title) return { error: "Title is required." };

  const allDay = parseBool(formData.get("allDay"));
  const startsAt = parseDateTimeLocal(formData.get("startsAt"));
  const endsAt = parseDateTimeLocal(formData.get("endsAt"));
  if (!startsAt || !endsAt) return { error: "Start and end are required." };
  if (endsAt < startsAt) return { error: "End must be after start." };

  const timezone = optStr(formData.get("timezone")) ?? (await getUserTimezone(userId));
  const description = optStr(formData.get("description"));
  const location = optStr(formData.get("location"));
  const rrule = optStr(formData.get("rrule"));
  const rruleUntil = rrule ? parseRruleUntil(rrule) : null;
  const offsets = parseOffsets(formData);

  const event = await prisma.calendarEvent.create({
    data: {
      userId,
      title,
      description,
      location,
      allDay,
      startsAt,
      endsAt,
      timezone,
      rrule,
      rruleUntil,
      reminders: {
        create: offsets.map((offsetMinutes) => ({
          userId,
          offsetMinutes,
          title: null,
        })),
      },
    },
  });

  invalidate(userId);
  return { id: event.id };
}

export async function updateEvent(formData: FormData) {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  const scope = (str(formData.get("scope")) || "all") as OccurrenceScope;
  const originalStartsAtRaw = optStr(formData.get("originalStartsAt"));
  const title = str(formData.get("title"));
  if (!id || !title) return { error: "Missing fields." };

  const existing = await prisma.calendarEvent.findFirst({
    where: { id, userId, deletedAt: null },
  });
  if (!existing) return { error: "Event not found." };

  const allDay = parseBool(formData.get("allDay"));
  const startsAt = parseDateTimeLocal(formData.get("startsAt"));
  const endsAt = parseDateTimeLocal(formData.get("endsAt"));
  if (!startsAt || !endsAt) return { error: "Start and end are required." };
  if (endsAt < startsAt) return { error: "End must be after start." };

  const timezone = optStr(formData.get("timezone")) ?? existing.timezone;
  const description = optStr(formData.get("description"));
  const location = optStr(formData.get("location"));
  const rrule = optStr(formData.get("rrule"));
  const offsets = parseOffsets(formData);

  // Non-recurring or edit entire series
  if (!existing.rrule || scope === "all") {
    await prisma.$transaction(async (tx) => {
      await tx.calendarEvent.update({
        where: { id },
        data: {
          title,
          description,
          location,
          allDay,
          startsAt,
          endsAt,
          timezone,
          rrule,
          rruleUntil: rrule ? parseRruleUntil(rrule) : null,
        },
      });
      if (scope === "all") {
        await tx.reminder.deleteMany({ where: { eventId: id, userId } });
        if (offsets.length) {
          await tx.reminder.createMany({
            data: offsets.map((offsetMinutes) => ({
              userId,
              eventId: id,
              offsetMinutes,
            })),
          });
        }
      }
    });
    invalidate(userId);
    return { ok: true };
  }

  const originalStartsAt = originalStartsAtRaw
    ? new Date(originalStartsAtRaw)
    : existing.startsAt;

  if (scope === "this") {
    await prisma.calendarEventException.upsert({
      where: {
        eventId_originalStartsAt: { eventId: id, originalStartsAt },
      },
      create: {
        eventId: id,
        originalStartsAt,
        cancelled: false,
        title,
        description,
        location,
        allDay,
        startsAt,
        endsAt,
      },
      update: {
        cancelled: false,
        title,
        description,
        location,
        allDay,
        startsAt,
        endsAt,
      },
    });
    invalidate(userId);
    return { ok: true };
  }

  // thisAndFuture: truncate old series, create new series from this occurrence
  await prisma.$transaction(async (tx) => {
    const truncatedRrule = truncateRrule(existing.rrule!, rruleUntilBefore(originalStartsAt));
    await tx.calendarEvent.update({
      where: { id },
      data: {
        rrule: truncatedRrule,
        rruleUntil: rruleUntilBefore(originalStartsAt),
      },
    });

    await tx.calendarEvent.create({
      data: {
        userId,
        title,
        description,
        location,
        allDay,
        startsAt,
        endsAt,
        timezone,
        rrule,
        rruleUntil: rrule ? parseRruleUntil(rrule) : null,
        reminders: {
          create: offsets.map((offsetMinutes) => ({
            userId,
            offsetMinutes,
          })),
        },
      },
    });
  });

  invalidate(userId);
  return { ok: true };
}

function formatUntil(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

function truncateRrule(rrule: string, until: Date): string {
  const body = rrule.replace(/^RRULE:/, "");
  const parts = body.split(";").filter((p) => !p.startsWith("UNTIL=") && !p.startsWith("COUNT="));
  parts.push(`UNTIL=${formatUntil(until)}`);
  return parts.join(";");
}

export async function deleteEvent(formData: FormData) {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  const scope = (str(formData.get("scope")) || "all") as OccurrenceScope;
  const originalStartsAtRaw = optStr(formData.get("originalStartsAt"));
  if (!id) return { error: "Missing id." };

  const existing = await prisma.calendarEvent.findFirst({
    where: { id, userId, deletedAt: null },
  });
  if (!existing) return { error: "Event not found." };

  if (!existing.rrule || scope === "all") {
    await prisma.calendarEvent.update({
      where: { id },
      data: { deletedAt: new Date(), status: "cancelled" },
    });
    invalidate(userId);
    return { ok: true };
  }

  const originalStartsAt = originalStartsAtRaw
    ? new Date(originalStartsAtRaw)
    : existing.startsAt;

  if (scope === "this") {
    await prisma.calendarEventException.upsert({
      where: {
        eventId_originalStartsAt: { eventId: id, originalStartsAt },
      },
      create: { eventId: id, originalStartsAt, cancelled: true },
      update: { cancelled: true },
    });
    invalidate(userId);
    return { ok: true };
  }

  // thisAndFuture
  const truncated = truncateRrule(existing.rrule, rruleUntilBefore(originalStartsAt));
  await prisma.calendarEvent.update({
    where: { id },
    data: {
      rrule: truncated,
      rruleUntil: rruleUntilBefore(originalStartsAt),
    },
  });
  invalidate(userId);
  return { ok: true };
}

export async function createReminder(formData: FormData) {
  const userId = await getUserId();
  const title = str(formData.get("title"));
  if (!title) return { error: "Title is required." };

  const remindAt = parseDateTimeLocal(formData.get("remindAt"));
  if (!remindAt) return { error: "When is required." };

  const rrule = optStr(formData.get("rrule"));
  const eventId = optStr(formData.get("eventId"));
  const offsetMinutesRaw = str(formData.get("offsetMinutes"));
  const offsetMinutes =
    offsetMinutesRaw === "" ? null : Number.isNaN(Number(offsetMinutesRaw)) ? null : Number(offsetMinutesRaw);

  const reminder = await prisma.reminder.create({
    data: {
      userId,
      title,
      remindAt: eventId ? null : remindAt,
      offsetMinutes: eventId ? offsetMinutes : null,
      eventId,
      rrule,
    },
  });

  invalidate(userId);
  return { id: reminder.id };
}

export async function updateReminder(formData: FormData) {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  const title = str(formData.get("title"));
  if (!id || !title) return { error: "Missing fields." };

  const remindAt = parseDateTimeLocal(formData.get("remindAt"));
  const rrule = optStr(formData.get("rrule"));

  await prisma.reminder.updateMany({
    where: { id, userId },
    data: {
      title,
      remindAt,
      rrule,
    },
  });
  invalidate(userId);
  return { ok: true };
}

export async function deleteReminder(formData: FormData) {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  if (!id) return { error: "Missing id." };

  await prisma.reminder.updateMany({
    where: { id, userId },
    data: { deletedAt: new Date(), status: "cancelled" },
  });
  invalidate(userId);
  return { ok: true };
}

export async function dismissReminder(formData: FormData) {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  if (!id) return;
  await prisma.reminder.updateMany({
    where: { id, userId },
    data: { status: "dismissed" },
  });
  invalidate(userId);
}
