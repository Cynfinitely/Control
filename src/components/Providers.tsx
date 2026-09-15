"use client";

import { SessionProvider } from "next-auth/react";
import { ToastProvider } from "@/components/Toast";
import { ThemeProvider } from "@/components/ThemeProvider";
import CommandPalette from "@/components/CommandPalette";
import { NotificationProvider } from "@/components/NotificationProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <ToastProvider>
          <NotificationProvider>
            {children}
            <CommandPalette />
          </NotificationProvider>
        </ToastProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
