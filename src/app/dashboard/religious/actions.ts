"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getUserId, str, optStr, num, parseDate, parseOptionalDate } from "@/lib/actions";
import { revalidateUserCache } from "@/lib/cache";
import { startOfDay } from "@/lib/date";
import { incrementLinkedGoals } from "@/lib/goal-links";
import { SUGGESTED_DAILY_READINGS } from "@/lib/daily-readings";
import { advanceBookmark, clampPage } from "@/lib/quran";

function invalidate(userId: string) {
  revalidateUserCache(userId, "religious", "dashboard");
  revalidatePath("/dashboard/religious");
  revalidatePath("/dashboard");
}

export async function setPrayer(formData: FormData) {
  const userId = await getUserId();
  const prayer = str(formData.get("prayer"));
  const status = str(formData.get("status"));
  const date = startOfDay(parseDate(formData.get("date")));
  if (!prayer || !status) return;

  const existing = await prisma.prayerLog.findUnique({
    where: { userId_date_prayer: { userId, date, prayer } },
  });

  await prisma.prayerLog.upsert({
    where: { userId_date_prayer: { userId, date, prayer } },
    update: { status },
    create: { userId, date, prayer, status },
  });

  if (status === "missed" && existing?.status !== "missed") {
    await prisma.qazaPrayer.create({
      data: { userId, prayer, sourceDate: date },
    });
  } else if (status === "ontime" && existing?.status === "missed") {
    const qaza = await prisma.qazaPrayer.findFirst({
      where: { userId, prayer, sourceDate: date, fulfilledAt: null },
      orderBy: { createdAt: "desc" },
    });
    if (qaza) {
      await prisma.qazaPrayer.delete({ where: { id: qaza.id } });
    }
  }

  invalidate(userId);
}

export async function fulfillQaza(formData: FormData) {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  await prisma.qazaPrayer.updateMany({
    where: { id, userId, fulfilledAt: null },
    data: { fulfilledAt: new Date() },
  });
  invalidate(userId);
}

export async function savePrayerDebt(formData: FormData) {
  const userId = await getUserId();
  const periodStart = parseOptionalDate(formData.get("periodStart"));
  const periodEnd = parseOptionalDate(formData.get("periodEnd"));
  const note = optStr(formData.get("note"));
  const prayers = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

  for (const prayer of prayers) {
    const owed = num(formData.get(`owed_${prayer}`));
    if (owed <= 0) {
      await prisma.prayerDebt.deleteMany({ where: { userId, prayer } });
      continue;
    }
    const existing = await prisma.prayerDebt.findUnique({
      where: { userId_prayer: { userId, prayer } },
    });
    await prisma.prayerDebt.upsert({
      where: { userId_prayer: { userId, prayer } },
      update: {
        owed,
        fulfilled: existing ? Math.min(existing.fulfilled, owed) : 0,
        periodStart,
        periodEnd,
        note,
      },
      create: {
        userId,
        prayer,
        owed,
        fulfilled: 0,
        periodStart,
        periodEnd,
        note,
      },
    });
  }

  invalidate(userId);
}

export async function fulfillPrayerDebt(formData: FormData) {
  const userId = await getUserId();
  const prayer = str(formData.get("prayer"));
  const amount = Math.max(1, num(formData.get("amount"), 1));
  if (!prayer) return;

  const debt = await prisma.prayerDebt.findUnique({
    where: { userId_prayer: { userId, prayer } },
  });
  if (!debt) return;

  const remaining = debt.owed - debt.fulfilled;
  if (remaining <= 0) return;

  await prisma.prayerDebt.update({
    where: { id: debt.id },
    data: { fulfilled: Math.min(debt.owed, debt.fulfilled + amount) },
  });

  invalidate(userId);
}

export async function clearPrayerDebt(formData: FormData) {
  const userId = await getUserId();
  const prayer = optStr(formData.get("prayer"));
  if (prayer) {
    await prisma.prayerDebt.deleteMany({ where: { userId, prayer } });
  } else {
    await prisma.prayerDebt.deleteMany({ where: { userId } });
  }
  invalidate(userId);
}

export async function logDhikr(formData: FormData) {
  const userId = await getUserId();
  const name = str(formData.get("name"));
  if (!name) return;
  await prisma.dhikrLog.create({
    data: {
      userId,
      name,
      count: num(formData.get("count")),
      date: startOfDay(parseDate(formData.get("date"))),
    },
  });
  invalidate(userId);
}

async function applyQuranReading(
  userId: string,
  pagesRead: number,
  date: Date,
  note: string | null
) {
  if (pagesRead <= 0) return;

  await prisma.$transaction(async (tx) => {
    const state = await tx.quranState.findUnique({ where: { userId } });
    const next = advanceBookmark({
      currentPage: state?.currentPage ?? 1,
      khatmsCompleted: state?.khatmsCompleted ?? 0,
      pagesRead,
    });

    await tx.quranProgress.create({
      data: {
        userId,
        pagesRead,
        fromPage: next.fromPage,
        toPage: next.toPage,
        note,
        date,
      },
    });

    await tx.quranState.upsert({
      where: { userId },
      create: {
        userId,
        currentPage: next.currentPage,
        khatmsCompleted: next.khatmsCompleted,
      },
      update: {
        currentPage: next.currentPage,
        khatmsCompleted: next.khatmsCompleted,
      },
    });
  });

  await incrementLinkedGoals(userId, "quran", date, pagesRead);
}

async function addLinkedQuranDailyEntry(userId: string, pagesRead: number, date: Date) {
  if (pagesRead <= 0) return;
  const quranItem = await prisma.dailyReadingItem.findFirst({
    where: { userId, linkKind: "quran" },
    select: { id: true },
  });
  if (!quranItem) return;
  await prisma.dailyReadingEntry.create({
    data: { userId, itemId: quranItem.id, amount: pagesRead, date },
  });
}

export async function logQuran(formData: FormData) {
  const userId = await getUserId();
  const date = startOfDay(parseDate(formData.get("date")));
  const pagesRead = Math.max(0, num(formData.get("pagesRead")));
  await applyQuranReading(userId, pagesRead, date, optStr(formData.get("note")));
  await addLinkedQuranDailyEntry(userId, pagesRead, date);
  invalidate(userId);
}

export async function setQuranPosition(formData: FormData) {
  const userId = await getUserId();
  const currentPage = clampPage(num(formData.get("currentPage"), 1));
  const existing = await prisma.quranState.findUnique({ where: { userId } });
  const khatmsInput = optStr(formData.get("khatmsCompleted"));
  const khatmsCompleted =
    khatmsInput === null
      ? existing?.khatmsCompleted ?? 0
      : Math.max(0, Math.floor(num(formData.get("khatmsCompleted"), 0)));

  await prisma.quranState.upsert({
    where: { userId },
    create: { userId, currentPage, khatmsCompleted },
    update: { currentPage, khatmsCompleted },
  });
  invalidate(userId);
}

export async function logDailyReading(formData: FormData) {
  const userId = await getUserId();
  const itemId = str(formData.get("itemId"));
  const amount = Math.max(0, num(formData.get("amount")));
  const date = startOfDay(parseDate(formData.get("date")));
  if (!itemId || amount <= 0) return;

  const item = await prisma.dailyReadingItem.findFirst({
    where: { id: itemId, userId },
    select: { id: true, linkKind: true },
  });
  if (!item) return;

  if (item.linkKind === "quran") {
    await applyQuranReading(userId, amount, date, null);
  }

  await prisma.dailyReadingEntry.create({
    data: { userId, itemId, amount, date },
  });
  invalidate(userId);
}

export async function saveDailyReadingItem(formData: FormData) {
  const userId = await getUserId();
  const id = optStr(formData.get("id"));
  const name = str(formData.get("name"));
  const unit = str(formData.get("unit")) === "times" ? "times" : "pages";
  const dailyTarget = Math.max(1, Math.floor(num(formData.get("dailyTarget"), 1)));
  if (!name) return;

  if (id) {
    const existing = await prisma.dailyReadingItem.findFirst({
      where: { id, userId },
    });
    if (!existing) return;
    await prisma.dailyReadingItem.update({
      where: { id },
      data: {
        name,
        unit: existing.linkKind === "quran" ? "pages" : unit,
        dailyTarget,
      },
    });
  } else {
    const maxOrder = await prisma.dailyReadingItem.aggregate({
      where: { userId },
      _max: { sortOrder: true },
    });
    await prisma.dailyReadingItem.create({
      data: {
        userId,
        name,
        unit,
        dailyTarget,
        sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
      },
    });
  }
  invalidate(userId);
}

export async function deleteDailyReadingItem(formData: FormData) {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  if (!id) return;
  await prisma.dailyReadingItem.deleteMany({ where: { id, userId } });
  invalidate(userId);
}

export async function seedSuggestedReadings(_formData?: FormData) {
  const userId = await getUserId();
  const count = await prisma.dailyReadingItem.count({ where: { userId } });
  if (count > 0) return;
  await prisma.dailyReadingItem.createMany({
    data: SUGGESTED_DAILY_READINGS.map((item, index) => ({
      userId,
      name: item.name,
      unit: item.unit,
      dailyTarget: item.dailyTarget,
      linkKind: item.linkKind,
      sortOrder: index,
    })),
  });
  invalidate(userId);
}

export async function logFasting(formData: FormData) {
  const userId = await getUserId();
  const date = startOfDay(parseDate(formData.get("date")));
  await prisma.fastingLog.upsert({
    where: { userId_date: { userId, date } },
    update: { kind: str(formData.get("kind")) || "ramadan", note: optStr(formData.get("note")) },
    create: {
      userId,
      date,
      kind: str(formData.get("kind")) || "ramadan",
      note: optStr(formData.get("note")),
    },
  });
  invalidate(userId);
}

export async function saveDhikrTarget(formData: FormData) {
  const userId = await getUserId();
  const name = str(formData.get("name"));
  const dailyTarget = num(formData.get("dailyTarget"), 33);
  if (!name) return;
  await prisma.dhikrTarget.upsert({
    where: { userId_name: { userId, name } },
    update: { dailyTarget },
    create: { userId, name, dailyTarget },
  });
  invalidate(userId);
}

export async function deleteDhikrTarget(formData: FormData) {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  await prisma.dhikrTarget.deleteMany({ where: { id, userId } });
  invalidate(userId);
}
