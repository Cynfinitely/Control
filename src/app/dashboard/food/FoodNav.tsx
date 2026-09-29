import Link from "next/link";
import clsx from "clsx";

const LINKS = [
  { href: "/dashboard/food", label: "Diary" },
  { href: "/dashboard/food/week", label: "Week" },
  { href: "/dashboard/food/report", label: "Reports" },
  { href: "/dashboard/food/meals", label: "Default Meals" },
  { href: "/dashboard/food/planner", label: "Planner" },
  { href: "/dashboard/food/settings", label: "Settings" },
] as const;

export type FoodNavHref = (typeof LINKS)[number]["href"];

export default function FoodNav({ active }: { active: FoodNavHref }) {
  return (
    <nav aria-label="Food sections" className="-mx-1 mb-6 flex gap-1 overflow-x-auto px-1 pb-1">
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          aria-current={link.href === active ? "page" : undefined}
          className={clsx(
            "touch-target flex shrink-0 items-center rounded-full px-3 text-sm font-medium transition",
            link.href === active
              ? "bg-brand-600 text-white"
              : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
