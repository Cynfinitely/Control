import Link from "next/link";
import { kindColor, type PlanKind } from "@/lib/plan/kinds";
import { isBlockOverdue } from "@/lib/plan/time";
import { toDateInputValue } from "@/lib/date";
import type { PlanBlockItem, PlanDayStats } from "@/lib/queries/plan";
import Icon from "@/components/Icon";

type Props = {
  blocks: PlanBlockItem[];
  stats: PlanDayStats;
  currentBlockId: string | null;
  dayValue: string;
  isToday: boolean;
};

export default function PlanPreview({ blocks, stats, currentBlockId, dayValue, isToday }: Props) {
  return (
    <section className="card mb-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="section-title">Today&apos;s plan</h2>
          {stats.totalBlocks > 0 ? (
            <p className="mt-1 text-sm text-slate-500">
              {stats.doneBlocks}/{stats.totalBlocks} done · {stats.completionPct}% complete
            </p>
          ) : (
            <p className="mt-1 text-sm text-slate-400">No blocks scheduled yet</p>
          )}
        </div>
        <Link href="/dashboard/plan" className="btn-primary text-sm">
          Edit plan
        </Link>
      </div>

      {stats.totalBlocks > 0 && (
        <div className="mb-4 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-brand-500 transition-all"
            style={{ width: `${stats.completionPct}%` }}
          />
        </div>
      )}

      {isToday && stats.runningBehindCount > 0 && (
        <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Running behind on {stats.runningBehindCount} block{stats.runningBehindCount === 1 ? "" : "s"}
        </p>
      )}

      {stats.hasOverlaps && (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          Some blocks overlap — review your schedule
        </p>
      )}

      {blocks.length === 0 ? (
        <p className="text-sm text-slate-400">
          Start your day by adding time blocks or accepting smart suggestions on the plan page.
        </p>
      ) : (
        <div className="space-y-2">
          {blocks.map((block) => {
            const active = isToday && block.id === currentBlockId;
            const overdue = isToday && isBlockOverdue(block.startTime, block.endTime, block.status);
            return (
              <div
                key={block.id}
                className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${kindColor(block.kind as PlanKind, block.color)} ${active ? "ring-2 ring-brand-400" : ""}`}
              >
                <span className="shrink-0 text-xs font-medium text-slate-500">
                  {block.startTime}
                </span>
                <span className={`min-w-0 flex-1 truncate text-sm ${block.status === "done" ? "line-through opacity-70" : ""}`}>
                  {block.title}
                </span>
                {active && <Icon name="calendar" className="h-4 w-4 shrink-0 text-brand-500" />}
                {overdue && !active && (
                  <span className="shrink-0 text-xs text-red-600">Late</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
