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

export async function getNotificationFeed() {
  const userId = await getUserId();
  const [items, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: [{ readAt: "asc" }, { dueAt: "desc" }],
      take: 40,
    }),
    prisma.notification.count({ where: { userId, readAt: null } }),
  ]);
  return {
    unreadCount,
    items: items.map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      dueAt: n.dueAt.toISOString(),
      readAt: n.readAt?.toISOString() ?? null,
      href: n.href,
      sourceType: n.sourceType,
    })),
  };
}
