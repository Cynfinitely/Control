"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import Icon from "@/components/Icon";
import { useNotificationFeed, type NotificationItem } from "@/components/NotificationProvider";
import { markAllNotificationsRead, markNotificationRead } from "@/app/dashboard/notifications/actions";
import { isNetworkError } from "@/lib/network-error";

export default function NotificationBell() {
  const router = useRouter();
  const { items, unreadCount, pending, refresh } = useNotificationFeed();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) refresh();
  }, [open, refresh]);

  async function onItemClick(item: NotificationItem) {
    try {
      const fd = new FormData();
      fd.set("id", item.id);
      await markNotificationRead(fd);
    } catch (error) {
      if (!isNetworkError(error)) throw error;
    }
    setOpen(false);
    if (item.href) router.push(item.href);
    refresh();
  }

  async function onMarkAll() {
    try {
      await markAllNotificationsRead();
    } catch (error) {
      if (!isNetworkError(error)) throw error;
    }
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
                    {item.body && <span className="text-xs text-slate-500 dark:text-slate-400">{item.body}</span>}
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
