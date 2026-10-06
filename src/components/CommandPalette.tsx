"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { visibleNavSections } from "@/lib/nav";
import { moduleFilter, type ModuleId } from "@/lib/modules";
import Icon from "@/components/Icon";

export const OPEN_COMMAND_PALETTE_EVENT = "control:open-command-palette";

/** Open the palette from anywhere (e.g. the sidebar search button). */
export function openCommandPalette() {
  window.dispatchEvent(new Event(OPEN_COMMAND_PALETTE_EVENT));
}

type Item = { id: string; label: string; icon: string; href: string; group: "Actions" | "Pages"; module?: ModuleId };

const ACTIONS: Item[] = [
  { id: "new-event", label: "New event", icon: "calendar", href: "/dashboard/calendar?view=month&new=event", group: "Actions", module: "calendar" },
  { id: "new-reminder", label: "New reminder", icon: "bell", href: "/dashboard/calendar?view=agenda&new=reminder", group: "Actions", module: "calendar" },
  { id: "add-todo", label: "Add todo", icon: "check", href: "/dashboard/todos?focus=add", group: "Actions", module: "todos" },
  { id: "log-food", label: "Log food", icon: "food", href: "/dashboard/food?focus=log", group: "Actions", module: "food" },
  { id: "log-workout", label: "Log workout", icon: "dumbbell", href: "/dashboard/exercise?focus=log", group: "Actions", module: "exercise" },
  { id: "write-journal", label: "Write journal entry", icon: "book", href: "/dashboard/journal?focus=add", group: "Actions", module: "journal" },
];

export default function CommandPalette({
  isAdmin = false,
  disabledModules = [],
}: {
  isAdmin?: boolean;
  disabledModules?: ModuleId[];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMac, setIsMac] = useState(true);
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  const listId = useId();

  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent));
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    function onOpen() {
      setOpen(true);
    }
    document.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_COMMAND_PALETTE_EVENT, onOpen);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_COMMAND_PALETTE_EVENT, onOpen);
    };
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      restoreRef.current = document.activeElement as HTMLElement | null;
      setQuery("");
      setActiveIndex(0);
      if (!dialog.open) dialog.showModal();
      inputRef.current?.focus();
    } else if (dialog.open) {
      dialog.close();
      restoreRef.current?.focus();
    }
  }, [open]);

  const items = useMemo(() => {
    const pages: Item[] = [
      ...visibleNavSections(disabledModules).flatMap((s) => s.items),
      { href: "/dashboard/settings", label: "Settings", icon: "settings" },
      ...(isAdmin ? [{ href: "/dashboard/admin", label: "Admin", icon: "users" }] : []),
    ].map((p) => ({ ...p, id: p.href, group: "Pages" as const }));
    const q = query.trim().toLowerCase();
    return [...moduleFilter(disabledModules).keep(ACTIONS), ...pages].filter((item) => item.label.toLowerCase().includes(q));
  }, [query, isAdmin, disabledModules]);

  useEffect(() => {
    setActiveIndex((i) => Math.min(i, Math.max(items.length - 1, 0)));
  }, [items.length]);

  function go(href: string) {
    restoreRef.current = null;
    setOpen(false);
    router.push(href);
  }

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (items.length ? (i + 1) % items.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (items.length ? (i - 1 + items.length) % items.length : 0));
    } else if (e.key === "Home") {
      setActiveIndex(0);
    } else if (e.key === "End") {
      setActiveIndex(Math.max(items.length - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = items[activeIndex];
      if (item) go(item.href);
    }
  }

  const activeId = items[activeIndex] ? `${listId}-${activeIndex}` : undefined;

  return (
    <dialog
      ref={dialogRef}
      aria-label="Command palette"
      onCancel={(e) => {
        e.preventDefault();
        setOpen(false);
      }}
      onClick={(e) => {
        if (e.target === dialogRef.current) setOpen(false);
      }}
      className="mx-auto mt-[12vh] w-[calc(100%-2rem)] max-w-lg rounded-xl bg-transparent p-0"
    >
      {open && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-2 border-b border-slate-200 px-4 dark:border-slate-700">
            <Icon name="search" className="h-4 w-4 shrink-0 text-slate-500" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIndex(0);
              }}
              onKeyDown={onInputKeyDown}
              placeholder="Jump to a page or action…"
              className="h-12 w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-500 dark:text-slate-100"
              role="combobox"
              aria-expanded="true"
              aria-controls={listId}
              aria-activedescendant={activeId}
              aria-autocomplete="list"
              aria-label="Search pages and actions"
            />
          </div>
          <ul id={listId} role="listbox" aria-label="Results" className="max-h-80 overflow-y-auto py-1">
            {items.length === 0 && <li className="px-4 py-6 text-center text-sm text-slate-500">No matches</li>}
            {items.map((item, index) => {
              const showGroup = index === 0 || items[index - 1].group !== item.group;
              return (
                <li key={item.id} role="presentation">
                  {showGroup && (
                    <p className="eyebrow px-4 pb-1 pt-2" aria-hidden="true">
                      {item.group}
                    </p>
                  )}
                  <div
                    id={`${listId}-${index}`}
                    role="option"
                    aria-selected={index === activeIndex}
                    onMouseMove={() => setActiveIndex(index)}
                    onClick={() => go(item.href)}
                    className={clsx(
                      "mx-1 flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-sm",
                      index === activeIndex
                        ? "bg-brand-50 text-brand-800 dark:bg-brand-950 dark:text-brand-200"
                        : "text-slate-700 dark:text-slate-200"
                    )}
                  >
                    <Icon name={item.icon} className="h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" />
                    <span className="flex-1">{item.label}</span>
                    {index === activeIndex && <Icon name="arrowRight" className="h-4 w-4 text-brand-500" />}
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="flex flex-wrap gap-x-3 border-t border-slate-100 px-4 py-2 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
            <span>
              <kbd className="rounded bg-slate-100 px-1 font-sans dark:bg-slate-700">↑</kbd>{" "}
              <kbd className="rounded bg-slate-100 px-1 font-sans dark:bg-slate-700">↓</kbd> to move
            </span>
            <span>
              <kbd className="rounded bg-slate-100 px-1 font-sans dark:bg-slate-700">Enter</kbd> to open
            </span>
            <span className="hidden sm:inline">
              <kbd className="rounded bg-slate-100 px-1 font-sans dark:bg-slate-700">{isMac ? "⌘K" : "Ctrl K"}</kbd> to toggle
            </span>
          </p>
        </div>
      )}
    </dialog>
  );
}
