import Link from "next/link";
import clsx from "clsx";

export const NETWORKING_TABS = [
  { id: "log", label: "Log", href: "/dashboard/networking" },
  { id: "people", label: "People", href: "/dashboard/networking?tab=people" },
  { id: "insights", label: "Insights", href: "/dashboard/networking?tab=insights" },
] as const;

export type NetworkingTabId = (typeof NETWORKING_TABS)[number]["id"];

export function parseNetworkingTab(value: string | undefined): NetworkingTabId {
  if (value === "people" || value === "insights") return value;
  return "log";
}

export default function NetworkingTabs({ active }: { active: NetworkingTabId }) {
  return (
    <nav
      role="tablist"
      aria-label="Networking sections"
      className="mb-6 flex flex-wrap gap-1 border-b border-slate-200 dark:border-slate-700"
    >
      {NETWORKING_TABS.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href}
          role="tab"
          aria-selected={active === tab.id}
          className={clsx(
            "touch-target px-4 py-2 text-sm font-medium transition",
            active === tab.id
              ? "border-b-2 border-brand-600 text-brand-700 dark:text-brand-400"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
