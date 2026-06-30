"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getUserId, str, optStr, num, parseDate } from "@/lib/actions";
import { revalidateUserCache } from "@/lib/cache";
import { startOfDay } from "@/lib/date";

function invalidateJournal(userId: string) {
  revalidateUserCache(userId, "journal", "dashboard");
  revalidatePath("/dashboard/journal");
}

export async function saveJournalEntry(formData: FormData) {
  const userId = await getUserId();
  const date = startOfDay(parseDate(formData.get("date")));
  const moodRaw = formData.get("mood");
  const mood = moodRaw ? num(moodRaw) : null;

  await prisma.journalEntry.upsert({
    where: { userId_date: { userId, date } },
    update: {
      mood,
      wins: optStr(formData.get("wins")),
      blockers: optStr(formData.get("blockers")),
      note: optStr(formData.get("note")),
    },
    create: {
      userId,
      date,
      mood,
      wins: optStr(formData.get("wins")),
      blockers: optStr(formData.get("blockers")),
      note: optStr(formData.get("note")),
    },
  });
  invalidateJournal(userId);
}
