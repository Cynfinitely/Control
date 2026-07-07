"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { navSections } from "@/lib/nav";
import Icon from "@/components/Icon";

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
  const filtered = items.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase())
  );

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
          placeholder="Jump to…"
          className="input rounded-none border-0 border-b border-slate-200 focus:ring-0 dark:border-slate-700"
          aria-label="Search pages"
        />
        <ul className="max-h-64 overflow-y-auto py-1">
          {filtered.length === 0 && (
            <li className="px-4 py-3 text-sm text-slate-400">No matches</li>
          )}
          {filtered.map((item) => (
            <li key={item.href}>
              <button
                type="button"
                className={clsx(
                  "flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm",
                  "hover:bg-brand-50 dark:hover:bg-brand-950"
                )}
                onClick={() => {
                  setOpen(false);
                  router.push(item.href);
                }}
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
