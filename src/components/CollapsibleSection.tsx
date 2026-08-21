"use client";

import { useState } from "react";
import clsx from "clsx";
import Icon from "@/components/Icon";

type Props = {
  title: string;
  count?: number;
  defaultOpen?: boolean;
  className?: string;
  children: React.ReactNode;
};

export default function CollapsibleSection({
  title,
  count,
  defaultOpen = false,
  className,
  children,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <details
      className={clsx("group", className)}
      open={open}
      onToggle={(event) => {
        const next = event.currentTarget.open;
        if (next !== open) setOpen(next);
      }}
    >
      <summary className="flex min-h-[44px] cursor-pointer list-none items-center gap-2 py-1 text-slate-700 dark:text-slate-200 [&::-webkit-details-marker]:hidden">
        <Icon
          name="chevronDown"
          className={clsx(
            "h-4 w-4 shrink-0 text-slate-400 transition-transform",
            open && "rotate-180"
          )}
        />
        <span className="font-medium">{title}</span>
        {count !== undefined && (
          <span className="text-sm font-normal text-slate-400">({count})</span>
        )}
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  );
}
