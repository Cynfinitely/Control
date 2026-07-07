"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Icon from "@/components/Icon";

const STORAGE_KEY = "control-onboarding-dismissed";

type CheckItem = {
  id: string;
  label: string;
  href: string;
  done: boolean;
};

type Props = {
  items: CheckItem[];
  userCreatedAt: string;
};

export default function OnboardingChecklist({ items, userCreatedAt }: Props) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  const created = new Date(userCreatedAt);
  const daysSince = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
  const allDone = items.every((i) => i.done);

  if (dismissed || daysSince > 7 || allDone) return null;

  return (
    <div className="card mb-6 border-brand-200 bg-brand-50/50 dark:border-brand-800 dark:bg-brand-950/30">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="section-title text-base">Complete your setup</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            A few quick steps to get the most out of Control.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            localStorage.setItem(STORAGE_KEY, "1");
            setDismissed(true);
          }}
          className="text-xs text-slate-400 hover:text-slate-600"
          aria-label="Dismiss setup checklist"
        >
          Dismiss
        </button>
      </div>
      <ul className="mt-4 space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className="flex items-center gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-white/60 dark:hover:bg-slate-800/60"
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                  item.done
                    ? "border-brand-600 bg-brand-600 text-white"
                    : "border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800"
                }`}
              >
                {item.done && <Icon name="check" className="h-3 w-3" />}
              </span>
              <span className={item.done ? "text-slate-400 line-through" : "text-slate-700 dark:text-slate-200"}>
                {item.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
