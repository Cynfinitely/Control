"use client";

import Link from "next/link";
import clsx from "clsx";

export type SegmentOption<T extends string = string> = {
  value: T;
  label: React.ReactNode;
  /** Render as a link (URL-driven state). Omit for in-page state with onChange. */
  href?: string;
  disabled?: boolean;
  title?: string;
};

type Props<T extends string> = {
  options: readonly SegmentOption<T>[];
  value: T | null | undefined;
  onChange?: (value: T) => void;
  "aria-label": string;
  size?: "sm" | "md";
  /** Stretch segments to fill the row */
  fill?: boolean;
  disabled?: boolean;
  className?: string;
};

/**
 * One visual style for every "pick one of N" control. Buttons expose
 * aria-pressed; link segments expose aria-current.
 */
export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  size = "md",
  fill = false,
  disabled = false,
  className,
  ...rest
}: Props<T>) {
  return (
    <div
      role="group"
      aria-label={rest["aria-label"]}
      className={clsx(
        "inline-flex max-w-full overflow-x-auto rounded-lg bg-slate-100 p-1 dark:bg-slate-900/60",
        fill && "flex w-full",
        className
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        const classes = clsx(
          "inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-md font-medium transition",
          size === "md" ? "min-h-[36px] px-3 text-sm" : "min-h-[32px] px-2.5 text-xs",
          fill && "flex-1",
          active
            ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200 dark:bg-slate-700 dark:text-white dark:ring-slate-600"
            : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100",
          (opt.disabled || disabled) && "pointer-events-none opacity-50"
        );
        if (opt.href) {
          return (
            <Link
              key={opt.value}
              href={opt.href}
              scroll={false}
              aria-current={active ? "true" : undefined}
              className={classes}
              title={opt.title}
            >
              {opt.label}
            </Link>
          );
        }
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={active}
            disabled={opt.disabled || disabled}
            onClick={() => onChange?.(opt.value)}
            className={classes}
            title={opt.title}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
