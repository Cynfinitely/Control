"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import Icon from "@/components/Icon";
import { useNotificationFeed, type NotificationItem } from "@/components/NotificationProvider";
import { markAllNotificationsRead, markNotificationRead } from "@/app/dashboard/notifications/actions";
import { isNetworkError } from "@/lib/network-error";
import { formatDateTime } from "@/lib/date";

type Props = {
  /** Which edge of the bell the popover aligns to. Use "left" inside the sidebar. */
  align?: "left" | "right";
};

export default function NotificationBell({ align = "right" }: Props) {
  const router = useRouter();
  const { items, unreadCount, pending, refresh } = useNotificationFeed();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (open) refresh();
  }, [open, refresh]);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    function onPointer(e: PointerEvent) {
      const target = e.target as Node;
      if (!panelRef.current?.contains(target) && !buttonRef.current?.contains(target)) setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

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
        ref={buttonRef}
        type="button"
        className="btn-icon relative"
        aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : "Notifications"}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((v) => !v)}
      >
        <Icon name="bell" className="h-5 w-5" />
        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-semibold text-white"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-labelledby={titleId}
          tabIndex={-1}
          className={clsx(
            "absolute z-[71] mt-2 w-[min(calc(100vw-1rem),22rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl outline-none dark:border-slate-700 dark:bg-slate-800",
            align === "left" ? "left-0" : "right-0"
          )}
        >
          <div className="flex items-center justify-between border-b border-slate-100 py-2 pl-4 pr-2 dark:border-slate-700">
            <h2 id={titleId} className="subsection-title">
              Notifications
            </h2>
            {unreadCount > 0 && (
              <button type="button" className="btn-ghost btn-sm" onClick={onMarkAll}>
                Mark all read
              </button>
            )}
          </div>
          <ul className="max-h-96 divide-y divide-slate-100 overflow-y-auto dark:divide-slate-700">
            {items.length === 0 && (
              <li className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                {pending ? "Loading…" : "You're all caught up."}
              </li>
            )}
            {items.map((item) => {
              const unread = !item.readAt;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onItemClick(item)}
                    className={clsx(
                      "flex w-full gap-3 px-4 py-3 text-left text-sm transition hover:bg-slate-50 dark:hover:bg-slate-700/50",
                      unread && "bg-brand-50/60 dark:bg-brand-950/30"
                    )}
                  >
                    <span
                      className={clsx("mt-1.5 h-2 w-2 shrink-0 rounded-full", unread ? "bg-brand-600" : "bg-transparent")}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline gap-2">
                        <span className={clsx("text-slate-900 dark:text-slate-100", unread ? "font-semibold" : "font-medium")}>
                          {item.title}
                        </span>
                        {unread && <span className="sr-only">(unread)</span>}
                      </span>
                      {item.body && (
                        <span className="mt-0.5 block text-xs text-slate-600 dark:text-slate-400">{item.body}</span>
                      )}
                      <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                        {formatDateTime(item.dueAt)}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
