"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import clsx from "clsx";

type ToastType = "success" | "error" | "info";

type ToastItem = {
  id: number;
  message: string;
  type: ToastType;
  action?: { label: string; onClick: () => void };
  duration: number;
};

type ToastInput = {
  message: string;
  type?: ToastType;
  action?: { label: string; onClick: () => void };
  duration?: number;
};

type ToastContextValue = {
  toast: (input: ToastInput) => void;
  success: (message: string, action?: ToastInput["action"]) => void;
  error: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 0;

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

function ToastItemView({ item, onDismiss }: { item: ToastItem; onDismiss: (id: number) => void }) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    timerRef.current = setTimeout(() => onDismiss(item.id), item.duration);
    return () => clearTimeout(timerRef.current);
  }, [item.id, item.duration, onDismiss]);

  return (
    <div
      role="status"
      className={clsx(
        "pointer-events-auto flex items-center gap-3 rounded-lg px-4 py-3 text-sm shadow-lg ring-1",
        item.type === "success" && "bg-green-50 text-green-800 ring-green-200 dark:bg-green-950 dark:text-green-100 dark:ring-green-800",
        item.type === "error" && "bg-red-50 text-red-800 ring-red-200 dark:bg-red-950 dark:text-red-100 dark:ring-red-800",
        item.type === "info" && "bg-white text-slate-800 ring-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700"
      )}
    >
      <span className="flex-1">{item.message}</span>
      {item.action && (
        <button
          type="button"
          onClick={() => {
            item.action?.onClick();
            onDismiss(item.id);
          }}
          className="shrink-0 font-medium underline underline-offset-2"
        >
          {item.action.label}
        </button>
      )}
      <button
        type="button"
        onClick={() => onDismiss(item.id)}
        className="shrink-0 opacity-60 hover:opacity-100"
        aria-label="Dismiss notification"
      >
        ×
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({ message, type = "info", action, duration = action ? 8000 : 4000 }: ToastInput) => {
      const id = ++nextId;
      setToasts((prev) => [...prev.slice(-4), { id, message, type, action, duration }]);
    },
    []
  );

  const success = useCallback(
    (message: string, action?: ToastInput["action"]) => toast({ message, type: "success", action }),
    [toast]
  );

  const error = useCallback(
    (message: string) => toast({ message, type: "error", duration: 5000 }),
    [toast]
  );

  return (
    <ToastContext.Provider value={{ toast, success, error }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2 px-4 sm:px-0"
      >
        {toasts.map((item) => (
          <ToastItemView key={item.id} item={item} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
