"use server";

import { prisma } from "@/lib/db";
import { getUserId, str } from "@/lib/actions";
import { revalidateUserCache } from "@/lib/cache";

export async function markNotificationRead(formData: FormData) {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  if (!id) return;
  await prisma.notification.updateMany({
    where: { id, userId, readAt: null },
    data: { readAt: new Date() },
  });
  revalidateUserCache(userId, "notifications", "dashboard");
}

export async function markAllNotificationsRead() {
  const userId = await getUserId();
  await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
  revalidateUserCache(userId, "notifications", "dashboard");
}
