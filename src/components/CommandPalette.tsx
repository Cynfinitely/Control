"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { navSections } from "@/lib/nav";
import Icon from "@/components/Icon";

type ActionItem = {
  id: string;
  label: string;
  icon: string;
  href: string;
};

const actions: ActionItem[] = [
  {
    id: "new-event",
    label: "New event",
    icon: "calendar",
    href: "/dashboard/calendar?view=month&new=event",
  },
  {
    id: "new-reminder",
    label: "New reminder",
    icon: "bell",
    href: "/dashboard/calendar?view=agenda&new=reminder",
  },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) setQuery("");
  }, [open]);

  if (!open) return null;

  const items = navSections.flatMap((s) => s.items);
  const q = query.toLowerCase();
  const filteredNav = items.filter((item) => item.label.toLowerCase().includes(q));
  const filteredActions = actions.filter((a) => a.label.toLowerCase().includes(q));

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center p-4 pt-[15vh]">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close command palette"
        onClick={() => setOpen(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="card relative z-10 w-full max-w-md overflow-hidden p-0 shadow-xl"
      >
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Jump to… or create"
          className="input rounded-none border-0 border-b border-slate-200 focus:ring-0 dark:border-slate-700"
          aria-label="Search pages"
        />
        <ul className="max-h-64 overflow-y-auto py-1">
          {filteredActions.length > 0 && (
            <>
              <li className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Actions
              </li>
              {filteredActions.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className={clsx(
                      "flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm",
                      "hover:bg-brand-50 dark:hover:bg-brand-950"
                    )}
                    onClick={() => go(item.href)}
                  >
                    <Icon name={item.icon} className="h-4 w-4 text-brand-600" />
                    {item.label}
                  </button>
                </li>
              ))}
            </>
          )}
          {filteredNav.length > 0 && (
            <li className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Pages
            </li>
          )}
          {filteredNav.length === 0 && filteredActions.length === 0 && (
            <li className="px-4 py-3 text-sm text-slate-400">No matches</li>
          )}
          {filteredNav.map((item) => (
            <li key={item.href}>
              <button
                type="button"
                className={clsx(
                  "flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm",
                  "hover:bg-brand-50 dark:hover:bg-brand-950"
                )}
                onClick={() => go(item.href)}
              >
                <Icon name={item.icon} className="h-4 w-4 text-brand-600" />
                {item.label}
              </button>
            </li>
          ))}
        </ul>
        <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-400 dark:border-slate-700">
          <kbd className="rounded bg-slate-100 px-1 dark:bg-slate-800">⌘K</kbd> to open ·{" "}
          <kbd className="rounded bg-slate-100 px-1 dark:bg-slate-800">Esc</kbd> to close
        </p>
      </div>
    </div>
  );
}
