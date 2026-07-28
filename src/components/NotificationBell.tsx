"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import Icon from "@/components/Icon";
import {
  getNotificationFeed,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/app/dashboard/notifications/actions";

type Item = {
  id: string;
  title: string;
  body: string | null;
  dueAt: string;
  readAt: string | null;
  href: string | null;
  sourceType: string;
};

export default function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pending, startTransition] = useTransition();

  const refresh = useCallback(() => {
    startTransition(async () => {
      const feed = await getNotificationFeed();
      setItems(feed.items);
      setUnreadCount(feed.unreadCount);
    });
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 45_000);
    return () => clearInterval(id);
  }, [refresh]);

  useEffect(() => {
    if (open) refresh();
  }, [open, refresh]);

  async function onItemClick(item: Item) {
    const fd = new FormData();
    fd.set("id", item.id);
    await markNotificationRead(fd);
    setOpen(false);
    if (item.href) router.push(item.href);
    refresh();
  }

  async function onMarkAll() {
    await markAllNotificationsRead();
    refresh();
  }

  return (
    <div className="relative">
      <button
        type="button"
        className="btn-ghost touch-target relative px-2"
        aria-label={unreadCount ? `${unreadCount} unread notifications` : "Notifications"}
        onClick={() => setOpen((v) => !v)}
      >
        <Icon name="bell" className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[70]"
            aria-label="Close notifications"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-label="Notifications"
            className="card absolute right-0 z-[71] mt-2 w-[min(100vw-2rem,22rem)] p-0 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2 dark:border-slate-700">
              <p className="text-sm font-semibold">Notifications</p>
              {unreadCount > 0 && (
                <button type="button" className="text-xs text-brand-600" onClick={onMarkAll}>
                  Mark all read
                </button>
              )}
            </div>
            <ul className="max-h-80 overflow-y-auto">
              {items.length === 0 && (
                <li className="px-3 py-6 text-center text-sm text-slate-400">
                  {pending ? "Loading…" : "You're all caught up"}
                </li>
              )}
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onItemClick(item)}
                    className={clsx(
                      "flex w-full flex-col gap-0.5 px-3 py-2.5 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800",
                      !item.readAt && "bg-brand-50/50 dark:bg-brand-950/30"
                    )}
                  >
                    <span className="font-medium text-slate-900 dark:text-slate-100">{item.title}</span>
                    {item.body && <span className="text-xs text-slate-500">{item.body}</span>}
                    <span className="text-[10px] text-slate-400">
                      {new Date(item.dueAt).toLocaleString()}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
