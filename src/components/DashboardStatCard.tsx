import Link from "next/link";
import Icon from "@/components/Icon";

type Props = {
  label: string;
  value: string | number;
  sub: string;
  href: string;
  icon: string;
  healthClass: string;
  progress?: number;
  compact?: boolean;
};

export default function DashboardStatCard({
  label,
  value,
  sub,
  href,
  icon,
  healthClass,
  progress,
  compact = false,
}: Props) {
  const pct = progress !== undefined ? Math.min(100, Math.max(0, progress)) : undefined;

  if (compact) {
    return (
      <Link href={href} className={`card px-3 py-3 transition hover:shadow-md ${healthClass}`}>
        <div className="flex items-center gap-2">
          <Icon name={icon} className="h-4 w-4 shrink-0 text-brand-500" />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
            <p className="truncate text-base font-semibold text-slate-900 dark:text-slate-100">{value}</p>
          </div>
        </div>
        {pct !== undefined && (
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
            <div
              className="h-full rounded-full bg-brand-500 transition-all"
              style={{ width: `${pct}%` }}
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        )}
        <p className="mt-1 truncate text-[11px] text-slate-400">{sub}</p>
      </Link>
    );
  }

  return (
    <Link href={href} className={`card transition hover:shadow-md ${healthClass}`}>
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
          {pct !== undefined && (
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
              <div
                className="h-full rounded-full bg-brand-500 transition-all"
                style={{ width: `${pct}%` }}
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          )}
          <p className="mt-0.5 text-xs text-slate-400">{sub}</p>
        </div>
        <Icon name={icon} className="h-5 w-5 shrink-0 text-brand-500" />
      </div>
    </Link>
  );
}

function greetingForHour(hour: number, name: string) {
  if (hour < 12) return `Good morning, ${name}`;
  if (hour < 17) return `Good afternoon, ${name}`;
  return `Good evening, ${name}`;
}

export { greetingForHour };
