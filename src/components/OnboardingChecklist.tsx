"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
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
    try {
      setDismissed(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  const created = new Date(userCreatedAt);
  const daysSince = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
  const doneCount = items.filter((i) => i.done).length;
  const allDone = doneCount === items.length;

  if (dismissed || daysSince > 7 || allDone) return null;

  return (
    <section
      className="card mb-6 border-brand-200 bg-brand-50/50 dark:border-brand-800 dark:bg-brand-950/30"
      aria-labelledby="onboarding-title"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="onboarding-title" className="section-title">
            Complete your setup
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {doneCount} of {items.length} done — a few quick steps to get the most out of Control.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            try {
              localStorage.setItem(STORAGE_KEY, "1");
            } catch {
              // ignore private mode
            }
            setDismissed(true);
          }}
          className="btn-ghost btn-sm min-h-[40px] shrink-0"
          aria-label="Dismiss setup checklist"
        >
          Dismiss
        </button>
      </div>
      <ul className="mt-4 space-y-1">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className="flex min-h-[44px] items-center gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-white/60 dark:hover:bg-slate-800/60"
            >
              <span
                aria-hidden="true"
                className={clsx(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded border",
                  item.done
                    ? "border-brand-600 bg-brand-600 text-white"
                    : "border-slate-400 bg-white dark:border-slate-500 dark:bg-slate-800"
                )}
              >
                {item.done && <Icon name="check" className="h-3 w-3" />}
              </span>
              <span className={item.done ? "text-muted line-through" : "text-slate-800 dark:text-slate-200"}>
                {item.label}
                <span className="sr-only">{item.done ? " (done)" : " (to do)"}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
