import Link from "next/link";
import clsx from "clsx";
import { kindColor, PLAN_KIND_LABELS, type PlanKind } from "@/lib/plan/kinds";
import { isBlockOverdue } from "@/lib/plan/time";
import type { PlanBlockItem, PlanDayStats } from "@/lib/queries/plan";
import EmptyState from "@/components/EmptyState";

type Props = {
  blocks: PlanBlockItem[];
  stats: PlanDayStats;
  currentBlockId: string | null;
  isToday: boolean;
};

export default function PlanPreview({ blocks, stats, currentBlockId, isToday }: Props) {
  return (
    <section className="card" aria-labelledby="plan-preview-title">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 id="plan-preview-title" className="section-title">
            Today&apos;s plan
          </h2>
          {stats.totalBlocks > 0 && (
            <p className="mt-1 text-sm text-muted">
              {stats.doneBlocks}/{stats.totalBlocks} blocks done · {stats.completionPct}%
            </p>
          )}
        </div>
        <Link href="/dashboard/plan" className="btn-ghost btn-sm min-h-[40px]">
          {stats.totalBlocks > 0 ? "Open plan" : "Plan your day"}
        </Link>
      </div>

      {stats.totalBlocks > 0 && (
        <div
          className="progress-track mb-4 h-2 overflow-hidden rounded-full"
          role="progressbar"
          aria-label="Plan completion"
          aria-valuenow={stats.completionPct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-brand-500 transition-all"
            style={{ width: `${stats.completionPct}%` }}
          />
        </div>
      )}

      {isToday && stats.runningBehindCount > 0 && (
        <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-300">
          Running behind on {stats.runningBehindCount} block{stats.runningBehindCount === 1 ? "" : "s"}
        </p>
      )}

      {stats.hasOverlaps && (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          Some blocks overlap — review your schedule
        </p>
      )}

      {blocks.length === 0 ? (
        <EmptyState
          variant="inline"
          headingLevel="h3"
          icon="calendar"
          title="No time blocks yet"
          description="Add blocks or accept smart suggestions on the plan page."
        />
      ) : (
        <ul className="space-y-2">
          {blocks.map((block) => {
            const active = isToday && block.id === currentBlockId;
            const overdue = isToday && isBlockOverdue(block.startTime, block.endTime, block.status);
            const done = block.status === "done";
            const skipped = block.status === "skipped";
            return (
              <li
                key={block.id}
                className={clsx(
                  "flex items-center gap-3 rounded-lg border px-3 py-2",
                  kindColor(block.kind as PlanKind, block.color),
                  active && "ring-2 ring-brand-400"
                )}
              >
                <span className="w-11 shrink-0 text-xs font-medium tabular-nums opacity-80">{block.startTime}</span>
                <span className={clsx("min-w-0 flex-1 truncate text-sm", (done || skipped) && "line-through opacity-70")}>
                  {block.title}
                  <span className="sr-only">
                    {" "}
                    ({PLAN_KIND_LABELS[block.kind as PlanKind] ?? block.kind}
                    {done ? ", done" : skipped ? ", skipped" : ""})
                  </span>
                </span>
                {active && <span className="badge-brand shrink-0">Now</span>}
                {overdue && !active && <span className="badge-danger shrink-0">Late</span>}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
