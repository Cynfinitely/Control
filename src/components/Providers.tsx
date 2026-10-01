"use client";

import { SessionProvider } from "next-auth/react";
import { ToastProvider } from "@/components/Toast";
import { ThemeProvider } from "@/components/ThemeProvider";
import { NotificationProvider } from "@/components/NotificationProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <ToastProvider>
          <NotificationProvider>
            {children}
          </NotificationProvider>
        </ToastProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
