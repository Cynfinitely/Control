import Link from "next/link";
import clsx from "clsx";
import Icon from "@/components/Icon";

type Props = {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  tip?: string;
  /** "card" = standalone page-level empty state; "inline" = inside an existing card/list */
  variant?: "card" | "inline";
  headingLevel?: "h2" | "h3";
  className?: string;
  children?: React.ReactNode;
};

export default function EmptyState({
  icon = "sparkles",
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  tip,
  variant = "card",
  headingLevel = "h2",
  className,
  children,
}: Props) {
  const Heading = headingLevel;
  const inline = variant === "inline";

  return (
    <div
      className={clsx(
        "flex flex-col items-center text-center",
        inline ? "rounded-lg border border-dashed border-slate-200 px-4 py-6 dark:border-slate-700" : "card py-10",
        className
      )}
    >
      <div
        className={clsx(
          "flex items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400",
          inline ? "mb-2 h-9 w-9" : "mb-4 h-14 w-14"
        )}
      >
        <Icon name={icon} className={inline ? "h-5 w-5" : "h-7 w-7"} />
      </div>
      <Heading
        className={clsx(
          "font-semibold text-slate-900 dark:text-slate-100",
          inline ? "text-sm" : "text-base"
        )}
      >
        {title}
      </Heading>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">{description}</p>
      )}
      {actionLabel && actionHref && (
        <Link href={actionHref} className={clsx(inline ? "btn-ghost btn-sm mt-3" : "btn-primary touch-target mt-4")}>
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && !actionHref && (
        <button
          type="button"
          onClick={onAction}
          className={clsx(inline ? "btn-ghost btn-sm mt-3" : "btn-primary touch-target mt-4")}
        >
          {actionLabel}
        </button>
      )}
      {children && <div className="mt-4">{children}</div>}
      {tip && <p className="mt-4 max-w-sm text-xs text-slate-500 dark:text-slate-400">{tip}</p>}
    </div>
  );
}
