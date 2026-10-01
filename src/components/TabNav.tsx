import Link from "next/link";
import clsx from "clsx";
import ScrollActiveIntoView from "@/components/ScrollActiveIntoView";

export type TabNavItem = {
  href: string;
  label: string;
  /** Matches `active` */
  id?: string;
  count?: number;
};

type Props = {
  items: readonly TabNavItem[];
  /** id (or href when items have no id) of the current page */
  active: string;
  "aria-label": string;
  variant?: "underline" | "pills";
  className?: string;
};

/**
 * Route-level section navigation (links, not ARIA tabs): the current page is
 * marked with aria-current="page". Scrolls horizontally on narrow screens.
 */
export default function TabNav({ items, active, variant = "underline", className, ...rest }: Props) {
  return (
    <ScrollActiveIntoView
      aria-label={rest["aria-label"]}
      className={clsx(
        "-mx-4 flex flex-nowrap gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0",
        variant === "underline" && "border-b border-slate-200 dark:border-slate-700",
        variant === "pills" && "pb-1",
        className ?? "mb-6"
      )}
    >
      {items.map((item) => {
        const isActive = (item.id ?? item.href) === active;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={clsx(
              "inline-flex min-h-[44px] shrink-0 items-center gap-1.5 whitespace-nowrap text-sm font-medium transition",
              variant === "underline" && [
                "-mb-px border-b-2 px-3",
                isActive
                  ? "border-brand-600 text-brand-700 dark:border-brand-400 dark:text-brand-300"
                  : "border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100",
              ],
              variant === "pills" && [
                "rounded-full px-3.5",
                isActive
                  ? "bg-brand-600 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800",
              ]
            )}
          >
            {item.label}
            {item.count !== undefined && item.count > 0 && (
              <span
                className={clsx(
                  "rounded-full px-1.5 text-xs font-semibold tabular-nums",
                  isActive && variant === "pills"
                    ? "bg-white/20 text-white"
                    : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                )}
              >
                {item.count}
              </span>
            )}
          </Link>
        );
      })}
    </ScrollActiveIntoView>
  );
}
