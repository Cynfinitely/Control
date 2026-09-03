"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getUserId, num, str } from "@/lib/actions";
import { revalidateUserCache } from "@/lib/cache";
import { startOfDay } from "@/lib/date";
import { failure, success, type ActionResult } from "@/lib/action-result";

const NOTE_MAX = 2000;

function invalidateMigraine(userId: string) {
  revalidateUserCache(userId, "migraine", "dashboard");
  revalidatePath("/dashboard/health/migraine");
}

function parseLogDate(value: FormDataEntryValue | null): Date | null {
  const raw = str(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  const date = startOfDay(new Date(raw + "T00:00:00"));
  return isNaN(date.getTime()) ? null : date;
}

function isFutureDay(date: Date): boolean {
  return date.getTime() > startOfDay(new Date()).getTime();
}

export async function saveMigraineLog(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const date = parseLogDate(formData.get("date"));
  if (!date) return failure("Pick a valid day.");
  if (isFutureDay(date)) return failure("You can only log today or past days.");

  const painRaw = formData.get("pain");
  const durationRaw = formData.get("durationMin");
  const noteRaw = formData.get("note");

  const hasPain = painRaw !== null && String(painRaw).trim() !== "";
  const hasDuration = durationRaw !== null && String(durationRaw).trim() !== "";
  const hasNote = noteRaw !== null;

  let pain: number | undefined;
  if (hasPain) {
    pain = num(painRaw);
    if (pain < 1 || pain > 10) return failure("Pain must be between 1 and 10.");
  }

  let durationMin: number | undefined;
  if (hasDuration) {
    durationMin = num(durationRaw);
    if (!Number.isFinite(durationMin) || durationMin < 0) {
      return failure("Duration must be a positive number of minutes.");
    }
  }

  let note: string | null | undefined;
  if (hasNote) {
    const trimmed = str(noteRaw);
    if (trimmed.length > NOTE_MAX) return failure("Note is too long.");
    note = trimmed === "" ? null : trimmed;
  }

  if (!hasPain && !hasDuration && !hasNote) {
    return failure("Nothing to save.");
  }

  const existing = await prisma.migraineLog.findFirst({
    where: { userId, date },
    select: { id: true },
  });

  if (!existing) {
    if (pain === undefined) return failure("Set a pain level first.");
    await prisma.migraineLog.create({
      data: {
        userId,
        date,
        pain,
        durationMin: durationMin ?? null,
        note: note ?? null,
      },
    });
  } else {
    const updated = await prisma.migraineLog.updateMany({
      where: { id: existing.id, userId },
      data: {
        ...(pain !== undefined ? { pain } : {}),
        ...(durationMin !== undefined ? { durationMin } : {}),
        ...(note !== undefined ? { note } : {}),
      },
    });
    if (updated.count === 0) return failure("Couldn't update that day.");
  }

  invalidateMigraine(userId);
  return success("Migraine day saved");
}

export async function clearMigraineLog(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const date = parseLogDate(formData.get("date"));
  if (!date) return failure("Pick a valid day.");
  if (isFutureDay(date)) return failure("You can only log today or past days.");

  await prisma.migraineLog.deleteMany({ where: { userId, date } });
  invalidateMigraine(userId);
  return success("Day cleared");
}
