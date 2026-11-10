import clsx from "clsx";
import Icon from "@/components/Icon";

/** "3 of 7 done" with a thin bar; turns green when the day is cleared. */
export default function DayProgress({
  done,
  total,
}: {
  done: number;
  total: number;
}) {
  if (total === 0) return null;
  const pct = Math.round((done / total) * 100);
  const complete = done === total;

  return (
    <div className="mb-4">
      <div className="mb-1.5 flex items-center justify-between gap-2 text-sm">
        <span
          className={clsx(
            "inline-flex items-center gap-1.5 font-medium",
            complete
              ? "text-green-700 dark:text-green-400"
              : "text-slate-700 dark:text-slate-200"
          )}
        >
          {complete && <Icon name="check" className="h-4 w-4" />}
          {complete ? "All done for the day" : `${done} of ${total} done`}
        </span>
        <span className="tabular-nums text-muted">{pct}%</span>
      </div>
      <div
        role="progressbar"
        aria-label="Todos done"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
        aria-valuetext={`${done} of ${total} done`}
        className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700"
      >
        <div
          className={clsx(
            "h-full rounded-full transition-[width] duration-500 ease-out motion-reduce:transition-none",
            complete ? "bg-green-500" : "bg-brand-600 dark:bg-brand-500"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
