"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { notificationPollDecision, shouldPollNotifications } from "@/lib/network-error";

export const NOTIFICATION_POLL_MS = 45_000;
export const NOTIFICATION_POLL_TIMEOUT_MS = 8_000;

export type NotificationItem = {
  id: string;
  title: string;
  body: string | null;
  dueAt: string;
  readAt: string | null;
  href: string | null;
  sourceType: string;
};

type NotificationFeedContextValue = {
  items: NotificationItem[];
  unreadCount: number;
  pending: boolean;
  refresh: () => void;
};

const NotificationFeedContext = createContext<NotificationFeedContextValue | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pending, setPending] = useState(false);
  const inFlightRef = useRef(false);
  const stoppedRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  const refresh = useCallback(() => {
    if (stoppedRef.current) return;
    if (
      !shouldPollNotifications({
        hidden: document.hidden,
        online: navigator.onLine,
        inFlight: inFlightRef.current,
      })
    ) {
      return;
    }

    inFlightRef.current = true;
    setPending(true);
    const controller = new AbortController();
    abortRef.current = controller;
    const timer = window.setTimeout(() => controller.abort(), NOTIFICATION_POLL_TIMEOUT_MS);

    fetch("/api/notifications", { signal: controller.signal })
      .then(async (res) => {
        const decision = notificationPollDecision({ status: res.status });
        if (decision === "stop") {
          stoppedRef.current = true;
          return;
        }
        if (decision !== "apply") return;
        const feed = (await res.json()) as { items: NotificationItem[]; unreadCount: number };
        setItems(feed.items);
        setUnreadCount(feed.unreadCount);
      })
      .catch(() => {
        // abort, timeout, and network errors must not throw into React
      })
      .finally(() => {
        window.clearTimeout(timer);
        if (abortRef.current === controller) abortRef.current = null;
        inFlightRef.current = false;
        setPending(false);
      });
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;

    function startOrStop() {
      if (stoppedRef.current) {
        if (interval != null) {
          clearInterval(interval);
          interval = undefined;
        }
        return;
      }
      const canPoll = shouldPollNotifications({
        hidden: document.hidden,
        online: navigator.onLine,
      });
      if (canPoll) {
        refresh();
        if (interval == null) {
          interval = setInterval(refresh, NOTIFICATION_POLL_MS);
        }
      } else if (interval != null) {
        clearInterval(interval);
        interval = undefined;
      }
    }

    startOrStop();
    document.addEventListener("visibilitychange", startOrStop);
    window.addEventListener("online", startOrStop);
    window.addEventListener("offline", startOrStop);
    return () => {
      if (interval != null) clearInterval(interval);
      abortRef.current?.abort();
      document.removeEventListener("visibilitychange", startOrStop);
      window.removeEventListener("online", startOrStop);
      window.removeEventListener("offline", startOrStop);
    };
  }, [refresh]);

  return (
    <NotificationFeedContext.Provider value={{ items, unreadCount, pending, refresh }}>
      {children}
    </NotificationFeedContext.Provider>
  );
}

export function useNotificationFeed() {
  const ctx = useContext(NotificationFeedContext);
  if (!ctx) {
    throw new Error("useNotificationFeed must be used within NotificationProvider");
  }
  return ctx;
}
