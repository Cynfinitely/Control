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
  await prisma.prayerLog.upsert({
    where: { userId_date_prayer: { userId, date, prayer } },
    update: { status },
    create: { userId, date, prayer, status },
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
