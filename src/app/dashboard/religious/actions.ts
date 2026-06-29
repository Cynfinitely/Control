"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getUserId, str, optStr, num, parseDate } from "@/lib/actions";
import { startOfDay } from "@/lib/date";

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

  revalidatePath("/dashboard/religious");
}

export async function fulfillQaza(formData: FormData) {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  await prisma.qazaPrayer.updateMany({
    where: { id, userId, fulfilledAt: null },
    data: { fulfilledAt: new Date() },
  });
  revalidatePath("/dashboard/religious");
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
  revalidatePath("/dashboard/religious");
}

export async function logQuran(formData: FormData) {
  const userId = await getUserId();
  await prisma.quranProgress.create({
    data: {
      userId,
      pagesRead: num(formData.get("pagesRead")),
      note: optStr(formData.get("note")),
      date: startOfDay(parseDate(formData.get("date"))),
    },
  });
  revalidatePath("/dashboard/religious");
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
  revalidatePath("/dashboard/religious");
}
