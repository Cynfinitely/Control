import Link from "next/link";
import clsx from "clsx";
import Icon from "@/components/Icon";

export type StatTone = "default" | "good" | "warn" | "bad";

type Props = {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  href?: string;
  icon?: string;
  /** Status tone. Always paired with `status` text so it never relies on color alone. */
  tone?: StatTone;
  status?: string;
  /** 0–100 */
  progress?: number;
  size?: "sm" | "md";
  /** "card" = standalone; "tile" = quiet inset tile inside another card */
  surface?: "card" | "tile";
  className?: string;
};

const TONE_BAR: Record<StatTone, string> = {
  default: "bg-brand-500",
  good: "bg-green-500",
  warn: "bg-amber-500",
  bad: "bg-red-500",
};

const TONE_BADGE: Record<StatTone, string> = {
  default: "badge-muted",
  good: "badge-success",
  warn: "badge-warning",
  bad: "badge-danger",
};

/** The app's single stat tile: label, big value, optional progress, hint and status. */
export default function StatCard({
  label,
  value,
  hint,
  href,
  icon,
  tone = "default",
  status,
  progress,
  size = "md",
  surface = "card",
  className,
}: Props) {
  const pct = progress !== undefined ? Math.round(Math.min(100, Math.max(0, progress))) : undefined;

  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className={clsx("text-slate-600 dark:text-slate-400", size === "sm" ? "text-xs" : "text-sm")}>{label}</p>
        {icon && <Icon name={icon} className="h-4 w-4 shrink-0 text-brand-500" />}
      </div>
      <p
        className={clsx(
          "mt-1 font-semibold tabular-nums tracking-tight text-slate-900 dark:text-slate-100",
          size === "sm" ? "text-lg" : "text-2xl"
        )}
      >
        {value}
      </p>
      {pct !== undefined && (
        <div
          className="progress-track mt-2 h-1.5 w-full overflow-hidden rounded-full"
          role="progressbar"
          aria-label={`${label} progress`}
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className={clsx("h-full rounded-full transition-all", TONE_BAR[tone])} style={{ width: `${pct}%` }} />
        </div>
      )}
      {(hint || status) && (
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          {status && <span className={TONE_BADGE[tone]}>{status}</span>}
          {hint && <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
        </div>
      )}
    </>
  );

  const classes = clsx(
    surface === "card" ? "card" : "tile",
    surface === "card" && size === "sm" && "p-4",
    "block min-w-0",
    href && "transition hover:border-brand-300 hover:shadow-md dark:hover:border-brand-700",
    className
  );

  return href ? (
    <Link href={href} className={classes}>
      {body}
    </Link>
  ) : (
    <div className={classes}>{body}</div>
  );
}
