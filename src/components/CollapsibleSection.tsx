"use client";

import { useState } from "react";
import clsx from "clsx";
import Icon from "@/components/Icon";

type Props = {
  title: string;
  count?: number;
  defaultOpen?: boolean;
  className?: string;
  /** Render the title as a heading so the section appears in the document outline. */
  as?: "h2" | "h3";
  /**
   * "plain" = disclosure row; "card" = a card whose summary is an action
   * (e.g. "Add goal") — replaces the ad-hoc `<details className="card">` panels.
   */
  variant?: "plain" | "card";
  /** Leading icon for the card variant (defaults to "plus"). */
  icon?: string;
  id?: string;
  children: React.ReactNode;
};

export default function CollapsibleSection({
  title,
  count,
  defaultOpen = false,
  className,
  as,
  variant = "plain",
  icon,
  id,
  children,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const Heading = as ?? "span";
  const isCard = variant === "card";

  return (
    <details
      id={id}
      className={clsx("group", isCard && "card p-0", className)}
      open={open}
      onToggle={(event) => {
        const next = event.currentTarget.open;
        if (next !== open) setOpen(next);
      }}
    >
      <summary
        className={clsx(
          "flex min-h-[44px] cursor-pointer list-none items-center gap-2 rounded-md [&::-webkit-details-marker]:hidden",
          isCard
            ? "px-5 py-3 font-medium text-brand-700 hover:bg-slate-50 dark:text-brand-400 dark:hover:bg-slate-700/40"
            : "py-1 text-slate-800 dark:text-slate-200"
        )}
      >
        {isCard ? (
          <Icon
            name={icon ?? "plus"}
            className={clsx("h-4 w-4 shrink-0 transition-transform", !icon && open && "rotate-45")}
          />
        ) : (
          <Icon
            name="chevronDown"
            className={clsx("h-4 w-4 shrink-0 text-slate-500 transition-transform", open && "rotate-180")}
          />
        )}
        <Heading className={clsx(as ? "text-base font-semibold" : "font-medium")}>{title}</Heading>
        {count !== undefined && (
          <span className="badge-muted tabular-nums" aria-label={`${count} items`}>
            {count}
          </span>
        )}
        {isCard && (
          <Icon
            name="chevronDown"
            className={clsx("ml-auto h-4 w-4 shrink-0 text-slate-400 transition-transform", open && "rotate-180")}
          />
        )}
      </summary>
      <div className={clsx(isCard ? "border-t border-slate-100 px-5 pb-5 pt-4 dark:border-slate-700" : "mt-3")}>
        {children}
      </div>
    </details>
  );
}
