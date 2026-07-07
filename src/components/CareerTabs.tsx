"use client";

import { useState } from "react";
import clsx from "clsx";

const TABS = [
  { id: "goals", label: "Goals" },
  { id: "skills", label: "Skills & Certs" },
  { id: "work", label: "Work History" },
  { id: "learning", label: "Learning" },
  { id: "applications", label: "Applications" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function CareerTabs({
  panels,
}: {
  panels: Record<TabId, React.ReactNode>;
}) {
  const [active, setActive] = useState<TabId>("goals");

  return (
    <div>
      <div
        role="tablist"
        aria-label="Career sections"
        className="mb-6 flex flex-wrap gap-1 border-b border-slate-200 dark:border-slate-700"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active === tab.id}
            onClick={() => setActive(tab.id)}
            className={clsx(
              "touch-target px-4 py-2 text-sm font-medium transition",
              active === tab.id
                ? "border-b-2 border-brand-600 text-brand-700 dark:text-brand-400"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div role="tabpanel">{panels[active]}</div>
    </div>
  );
}
