"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getUserId, str, optStr, num, parseDate, parseOptionalDate } from "@/lib/actions";
import { revalidateUserCache } from "@/lib/cache";
import { endOfDay, startOfDay } from "@/lib/date";
import { incrementLinkedGoals } from "@/lib/goal-links";
import { SUGGESTED_DAILY_READINGS } from "@/lib/daily-readings";
import { advanceBookmark, clampPage } from "@/lib/quran";
import { PRAYERS } from "@/lib/prayer-debt";
import { prayerLabel } from "@/lib/religious/day-prayers";
import { success, failure, type ActionResult } from "@/lib/action-result";

function invalidate(userId: string) {
  revalidateUserCache(userId, "religious", "dashboard");
  revalidatePath("/dashboard/religious");
  revalidatePath("/dashboard");
}

function isPrayer(value: string): boolean {
  return (PRAYERS as readonly string[]).includes(value);
}

/** Same date normalisation for every prayer-log action, so qaza sourceDates match. */
function prayerLogDate(value: FormDataEntryValue | null): Date {
  return startOfDay(parseDate(value));
}

export async function setPrayer(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const prayer = str(formData.get("prayer"));
  const status = str(formData.get("status"));
  const date = prayerLogDate(formData.get("date"));
  if (!prayer || !status) return failure("Choose a prayer and a status.");
  if (!isPrayer(prayer)) return failure("Unknown prayer.");
  if (status !== "ontime" && status !== "missed") return failure("Unknown status.");

  const existing = await prisma.prayerLog.findUnique({
    where: { userId_date_prayer: { userId, date, prayer } },
  });

  await prisma.prayerLog.upsert({
    where: { userId_date_prayer: { userId, date, prayer } },
    update: { status },
    create: { userId, date, prayer, status },
  });

  let qazaNote = "";
  if (status === "missed" && existing?.status !== "missed") {
    await prisma.qazaPrayer.create({
      data: { userId, prayer, sourceDate: date },
    });
    qazaNote = " · added to qaza";
  } else if (status === "ontime" && existing?.status === "missed") {
    const qaza = await prisma.qazaPrayer.findFirst({
      where: { userId, prayer, sourceDate: date, fulfilledAt: null },
      orderBy: { createdAt: "desc" },
    });
    if (qaza) {
      await prisma.qazaPrayer.delete({ where: { id: qaza.id } });
      qazaNote = " · removed from qaza";
    }
  }

  invalidate(userId);
  return success(`${prayerLabel(prayer)} marked ${status === "ontime" ? "on time" : "missed"}${qazaNote}`);
}

/**
 * Remove a status set by mistake. When the prayer was marked missed, the
 * unfulfilled qaza entry that marking created is removed too (mirrors the
 * missed → on time switch in setPrayer). Fulfilled qaza is never touched.
 */
export async function clearPrayer(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const prayer = str(formData.get("prayer"));
  const date = prayerLogDate(formData.get("date"));
  if (!isPrayer(prayer)) return failure("Unknown prayer.");

  const removedQaza = await prisma.$transaction(async (tx) => {
    const existing = await tx.prayerLog.findUnique({
      where: { userId_date_prayer: { userId, date, prayer } },
    });
    if (!existing) return null;
    await tx.prayerLog.delete({ where: { id: existing.id } });
    if (existing.status !== "missed") return false;
    const qaza = await tx.qazaPrayer.findFirst({
      where: { userId, prayer, sourceDate: date, fulfilledAt: null },
      orderBy: { createdAt: "desc" },
    });
    if (!qaza) return false;
    await tx.qazaPrayer.delete({ where: { id: qaza.id } });
    return true;
  });

  invalidate(userId);
  if (removedQaza === null) return success(`${prayerLabel(prayer)} has no status to clear`);
  return success(`${prayerLabel(prayer)} cleared${removedQaza ? " · removed from qaza" : ""}`);
}

/**
 * Mark every prayer that has no status yet as on time for the given day.
 * Existing statuses (including "missed") are never overwritten.
 */
export async function markAllPrayersOnTime(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const date = prayerLogDate(formData.get("date"));

  const result = await prisma.$transaction(async (tx) => {
    // Range match (like getDayPrayers) so logs stored at another time of day still count.
    const existing = await tx.prayerLog.findMany({
      where: { userId, date: { gte: date, lte: endOfDay(date) } },
      select: { prayer: true, status: true },
    });
    const logged = new Set(existing.map((l) => l.prayer));
    const toCreate = PRAYERS.filter((p) => !logged.has(p));
    for (const prayer of toCreate) {
      await tx.prayerLog.create({ data: { userId, date, prayer, status: "ontime" } });
    }
    const missed = existing.filter((l) => l.status === "missed").length;
    return { created: toCreate.length, missed };
  });

  invalidate(userId);
  if (result.created === 0) return success("Every prayer already has a status");
  const marked = `Marked ${result.created} ${result.created === 1 ? "prayer" : "prayers"} on time`;
  return success(
    result.missed > 0
      ? `${marked} · ${result.missed} missed left unchanged`
      : marked
  );
}

export async function fulfillQaza(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  const result = await prisma.qazaPrayer.updateMany({
    where: { id, userId, fulfilledAt: null },
    data: { fulfilledAt: new Date() },
  });
  if (result.count === 0) return failure("That qaza is already fulfilled.");
  invalidate(userId);
  return success("Qaza fulfilled");
}

/** Fulfil the oldest N pending daily qaza for one prayer. */
export async function fulfillQazaForPrayer(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const prayer = str(formData.get("prayer"));
  if (!isPrayer(prayer)) return failure("Unknown prayer.");
  const amount = Math.floor(num(formData.get("amount"), 1));
  if (!(amount >= 1)) return failure("Enter how many you made up (1 or more).");

  const pending = await prisma.qazaPrayer.findMany({
    where: { userId, prayer, fulfilledAt: null },
    orderBy: [{ sourceDate: "asc" }, { createdAt: "asc" }],
    take: amount,
    select: { id: true },
  });
  if (pending.length === 0) return failure(`No pending ${prayerLabel(prayer)} qaza.`);

  await prisma.qazaPrayer.updateMany({
    where: { id: { in: pending.map((q) => q.id) }, userId, fulfilledAt: null },
    data: { fulfilledAt: new Date() },
  });
  invalidate(userId);
  return success(
    `${pending.length} ${prayerLabel(prayer)} qaza fulfilled${pending.length < amount ? " (all that were pending)" : ""}`
  );
}

export async function savePrayerDebt(formData: FormData): Promise<ActionResult> {
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
  return success("Historical debt saved");
}

export async function fulfillPrayerDebt(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const prayer = str(formData.get("prayer"));
  const amount = Math.max(1, num(formData.get("amount"), 1));
  if (!prayer) return failure("Choose a prayer.");

  const debt = await prisma.prayerDebt.findUnique({
    where: { userId_prayer: { userId, prayer } },
  });
  if (!debt) return failure("No historical debt for that prayer.");

  const remaining = debt.owed - debt.fulfilled;
  if (remaining <= 0) return failure(`${prayerLabel(prayer)} debt is already complete.`);

  const fulfilled = Math.min(debt.owed, debt.fulfilled + amount);
  await prisma.prayerDebt.update({
    where: { id: debt.id },
    data: { fulfilled },
  });

  invalidate(userId);
  return success(`${fulfilled - debt.fulfilled} ${prayerLabel(prayer)} fulfilled · ${debt.owed - fulfilled} left`);
}

export async function clearPrayerDebt(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const prayer = optStr(formData.get("prayer"));
  if (prayer) {
    await prisma.prayerDebt.deleteMany({ where: { userId, prayer } });
  } else {
    await prisma.prayerDebt.deleteMany({ where: { userId } });
  }
  invalidate(userId);
  return success(prayer ? `${prayerLabel(prayer)} debt cleared` : "Historical debt cleared");
}

export async function logDhikr(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const name = str(formData.get("name"));
  if (!name) return failure("Enter the dhikr you recited.");
  const count = num(formData.get("count"));
  if (!(count > 0)) return failure("Enter a count above 0.");
  await prisma.dhikrLog.create({
    data: {
      userId,
      name,
      count,
      date: startOfDay(parseDate(formData.get("date"))),
    },
  });
  invalidate(userId);
  return success(`${count} × ${name} logged`);
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

export async function logQuran(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const date = startOfDay(parseDate(formData.get("date")));
  const pagesRead = Math.max(0, num(formData.get("pagesRead")));
  if (pagesRead <= 0) return failure("Enter how many pages you read.");
  await applyQuranReading(userId, pagesRead, date, optStr(formData.get("note")));
  await addLinkedQuranDailyEntry(userId, pagesRead, date);
  invalidate(userId);
  return success(`${pagesRead} ${pagesRead === 1 ? "page" : "pages"} logged`);
}

export async function setQuranPosition(formData: FormData): Promise<ActionResult> {
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
  return success(`Bookmark set to page ${currentPage}`);
}

export async function logDailyReading(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const itemId = str(formData.get("itemId"));
  const amount = Math.max(0, num(formData.get("amount")));
  const date = startOfDay(parseDate(formData.get("date")));
  if (!itemId) return failure("Choose a reading.");
  if (amount <= 0) return failure("Enter an amount above 0.");

  const item = await prisma.dailyReadingItem.findFirst({
    where: { id: itemId, userId },
    select: { id: true, linkKind: true, name: true, unit: true },
  });
  if (!item) return failure("Reading not found.");

  if (item.linkKind === "quran") {
    await applyQuranReading(userId, amount, date, null);
  }

  await prisma.dailyReadingEntry.create({
    data: { userId, itemId, amount, date },
  });
  invalidate(userId);
  const unit = item.unit === "times" ? (amount === 1 ? "time" : "times") : amount === 1 ? "page" : "pages";
  return success(`${item.name}: +${amount} ${unit}`);
}

export async function saveDailyReadingItem(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const id = optStr(formData.get("id"));
  const name = str(formData.get("name"));
  const unit = str(formData.get("unit")) === "times" ? "times" : "pages";
  const dailyTarget = Math.max(1, Math.floor(num(formData.get("dailyTarget"), 1)));
  if (!name) return failure("Enter a name for the reading.");

  if (id) {
    const existing = await prisma.dailyReadingItem.findFirst({
      where: { id, userId },
    });
    if (!existing) return failure("Reading not found.");
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
  return success(id ? "Reading saved" : "Reading added");
}

export async function deleteDailyReadingItem(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  if (!id) return failure("Reading not found.");
  const result = await prisma.dailyReadingItem.deleteMany({ where: { id, userId } });
  if (result.count === 0) return failure("Reading not found.");
  invalidate(userId);
  return success("Reading removed");
}

export async function seedSuggestedReadings(_formData?: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const count = await prisma.dailyReadingItem.count({ where: { userId } });
  if (count > 0) return failure("You already have readings set up.");
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
  return success("Suggested readings added");
}

export async function logFasting(formData: FormData): Promise<ActionResult> {
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
  return success("Fast logged");
}

export async function saveDhikrTarget(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const name = str(formData.get("name"));
  const dailyTarget = num(formData.get("dailyTarget"), 33);
  if (!name) return failure("Enter the dhikr name.");
  if (!(dailyTarget > 0)) return failure("Enter a daily target above 0.");
  await prisma.dhikrTarget.upsert({
    where: { userId_name: { userId, name } },
    update: { dailyTarget },
    create: { userId, name, dailyTarget },
  });
  invalidate(userId);
  return success("Target saved");
}

export async function deleteDhikrTarget(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  const result = await prisma.dhikrTarget.deleteMany({ where: { id, userId } });
  if (result.count === 0) return failure("Target not found.");
  invalidate(userId);
  return success("Target removed");
}
