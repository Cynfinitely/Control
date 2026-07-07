import Link from "next/link";
import Icon from "@/components/Icon";

type Props = {
  icon: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  tip?: string;
};

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  tip,
}: Props) {
  return (
    <div className="card flex flex-col items-center py-10 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400">
        <Icon name={icon} className="h-7 w-7" />
      </div>
      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">{description}</p>
      {actionLabel && actionHref && (
        <Link href={actionHref} className="btn-primary touch-target mt-4">
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && !actionHref && (
        <button type="button" onClick={onAction} className="btn-primary touch-target mt-4">
          {actionLabel}
        </button>
      )}
      {tip && (
        <p className="mt-4 max-w-sm text-xs text-slate-400 dark:text-slate-500">{tip}</p>
      )}
    </div>
  );
}
