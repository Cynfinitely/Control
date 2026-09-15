import { prisma } from "@/lib/db";

export type NotificationFeedItem = {
  id: string;
  title: string;
  body: string | null;
  dueAt: string;
  readAt: string | null;
  href: string | null;
  sourceType: string;
};

export type NotificationFeed = {
  unreadCount: number;
  items: NotificationFeedItem[];
};

export async function getNotificationFeed(userId: string): Promise<NotificationFeed> {
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
