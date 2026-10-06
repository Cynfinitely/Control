"use client";

import { Fragment, useEffect, useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import Icon from "@/components/Icon";
import ActionForm from "@/components/ActionForm";
import SubmitButton from "@/components/SubmitButton";
import EmptyState from "@/components/EmptyState";
import CheckButton from "@/components/CheckButton";
import PendingIndicator from "@/components/PendingIndicator";
import DeleteConfirmButton from "@/components/DeleteConfirmButton";
import { useToast } from "@/components/Toast";
import { kindColor, PLAN_KIND_LABELS, PLAN_KIND_LINKS, PLAN_KIND_MODULES, type PlanKind } from "@/lib/plan/kinds";
import { useModules } from "@/components/ModulesProvider";
import { formatMinutesToTime, getCurrentTimeMinutes, isBlockActive, isBlockOverdue, parseTimeToMinutes } from "@/lib/plan/time";
import { blocksOverlap } from "@/lib/plan/overlap";
import type { ActionResult } from "@/lib/action-result";
import type { PlanBlockItem } from "@/lib/queries/plan";
import {
  togglePlanBlockStatus,
  skipPlanBlock,
  deletePlanBlock,
  updatePlanBlock,
} from "./actions";

type Props = {
  initialBlocks: PlanBlockItem[];
  isToday: boolean;
  showCurrentTimeLine?: boolean;
};

type OptimisticAction =
  | { type: "toggle"; id: string }
  | { type: "skip"; id: string }
  | { type: "delete"; id: string };

function applyOptimistic(blocks: PlanBlockItem[], action: OptimisticAction): PlanBlockItem[] {
  switch (action.type) {
    case "toggle":
      return blocks.map((b) =>
        b.id === action.id
          ? { ...b, status: b.status === "done" ? "planned" : "done" }
          : b
      );
    case "skip":
      return blocks.map((b) => (b.id === action.id ? { ...b, status: "skipped" } : b));
    case "delete":
      return blocks.filter((b) => b.id !== action.id);
  }
}

/** Client clock (minutes since midnight), refreshed each minute. Null until mounted to avoid hydration mismatch. */
function useNowMinutes(enabled: boolean) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    if (!enabled) return;
    setNow(getCurrentTimeMinutes());
    const timer = setInterval(() => setNow(getCurrentTimeMinutes()), 60_000);
    return () => clearInterval(timer);
  }, [enabled]);
  return enabled ? now : null;
}

function NowLine({ minutes }: { minutes: number }) {
  const label = formatMinutesToTime(minutes);
  return (
    <div role="separator" aria-label={`Current time ${label}`} className="flex items-center gap-2 py-0.5">
      <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-brand-600 dark:bg-brand-400" aria-hidden="true" />
      <span className="shrink-0 text-xs font-semibold tabular-nums text-brand-700 dark:text-brand-300">Now {label}</span>
      <span className="h-0.5 flex-1 rounded bg-brand-500/70" aria-hidden="true" />
    </div>
  );
}

function BlockRow({
  block,
  isToday,
  hasOverlap,
  onToggle,
  onSkip,
  onDelete,
  pending,
}: {
  block: PlanBlockItem;
  isToday: boolean;
  hasOverlap: boolean;
  onToggle: (id: string) => void;
  onSkip: (id: string) => void;
  onDelete: (id: string) => void;
  pending: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const isDone = block.status === "done";
  const isSkipped = block.status === "skipped";
  const active = isToday && isBlockActive(block.startTime, block.endTime) && block.status === "planned";
  const overdue = isToday && isBlockOverdue(block.startTime, block.endTime, block.status);
  const modules = useModules();
  const kindModule = PLAN_KIND_MODULES[block.kind as PlanKind];
  const moduleLink = !kindModule || modules.has(kindModule) ? PLAN_KIND_LINKS[block.kind as PlanKind] : undefined;
  const kindLabel = PLAN_KIND_LABELS[block.kind as PlanKind] ?? block.kind;
  const formId = `block-${block.id}`;

  return (
    <div
      className={clsx(
        "card border-l-4 py-3",
        kindColor(block.kind, block.color),
        active && "ring-2 ring-brand-400",
        (isDone || isSkipped) && "opacity-90"
      )}
    >
      <div className="flex items-start gap-3">
        <CheckButton
          checked={isDone}
          disabled={pending || isSkipped}
          onChange={() => onToggle(block.id)}
          label={
            isSkipped
              ? `“${block.title}” was skipped`
              : isDone
                ? `Mark “${block.title}” not done`
                : `Mark “${block.title}” done`
          }
          className="mt-0.5"
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={clsx("font-medium", isDone && "line-through")}>{block.title}</span>
            <span className="badge-muted">{kindLabel}</span>
            {active && <span className="badge-brand">Now</span>}
            {isSkipped && <span className="badge-muted">Skipped</span>}
            {overdue && <span className="badge-danger">Running behind</span>}
            {hasOverlap && (
              <span className="badge-danger">
                <Icon name="alert" className="h-3 w-3" />
                Overlaps another block
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm tabular-nums">
            {block.startTime} – {block.endTime}
          </p>
          {block.notes && <p className="mt-1 text-sm">{block.notes}</p>}
          {moduleLink && (
            <Link href={moduleLink} className="mt-1 inline-flex min-h-[32px] items-center rounded-sm text-xs font-medium underline underline-offset-2 hover:no-underline">
              Open in {kindLabel.toLowerCase()}
              <Icon name="arrowRight" className="ml-1 h-3 w-3" />
            </Link>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
          {!isDone && !isSkipped && (
            <button
              type="button"
              disabled={pending}
              onClick={() => onSkip(block.id)}
              className="btn-ghost btn-sm min-h-[40px]"
              aria-label={`Skip “${block.title}”`}
            >
              Skip
            </button>
          )}
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="btn-ghost btn-sm min-h-[40px]"
            aria-expanded={editing}
            aria-controls={`${formId}-edit`}
            aria-label={`Edit “${block.title}”`}
          >
            {editing ? "Close" : "Edit"}
          </button>
          <DeleteConfirmButton
            disabled={pending}
            title={`Delete “${block.title}”?`}
            message="The block will be removed from this day's plan."
            label={`Delete “${block.title}”`}
            onConfirm={() => onDelete(block.id)}
          />
        </div>
      </div>

      {editing && (
        <ActionForm
          id={`${formId}-edit`}
          action={updatePlanBlock}
          onSuccess={() => setEditing(false)}
          className="mt-3 grid grid-cols-1 gap-3 border-t border-slate-200/60 pt-3 sm:grid-cols-2 dark:border-slate-700/60"
        >
          <input type="hidden" name="id" value={block.id} />
          <div className="sm:col-span-2">
            <label htmlFor={`${formId}-title`} className="label">
              Title
            </label>
            <input id={`${formId}-title`} name="title" className="input" defaultValue={block.title} required />
          </div>
          <div>
            <label htmlFor={`${formId}-start`} className="label">
              Start
            </label>
            <input id={`${formId}-start`} name="startTime" type="time" className="input" defaultValue={block.startTime} required />
          </div>
          <div>
            <label htmlFor={`${formId}-end`} className="label">
              End
            </label>
            <input id={`${formId}-end`} name="endTime" type="time" className="input" defaultValue={block.endTime} required />
          </div>
          <div>
            <label htmlFor={`${formId}-kind`} className="label">
              Kind
            </label>
            <select id={`${formId}-kind`} name="kind" className="input" defaultValue={block.kind}>
              {Object.entries(PLAN_KIND_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={`${formId}-notes`} className="label">
              Notes
            </label>
            <input id={`${formId}-notes`} name="notes" className="input" defaultValue={block.notes ?? ""} placeholder="Optional" />
          </div>
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <SubmitButton className="btn-primary" pendingLabel="Saving…">
              Save changes
            </SubmitButton>
            <button type="button" className="btn-ghost" onClick={() => setEditing(false)}>
              Cancel
            </button>
          </div>
        </ActionForm>
      )}
    </div>
  );
}

export default function PlanTimeline({ initialBlocks, isToday, showCurrentTimeLine }: Props) {
  const [pending, startTransition] = useTransition();
  const [blocks, setOptimistic] = useOptimistic(initialBlocks, applyOptimistic);
  const router = useRouter();
  const { success, error } = useToast();
  const nowMinutes = useNowMinutes(Boolean(showCurrentTimeLine && isToday));

  function run(action: OptimisticAction, fn: (fd: FormData) => Promise<ActionResult>) {
    startTransition(async () => {
      setOptimistic(action);
      let result: ActionResult;
      try {
        const fd = new FormData();
        fd.set("id", action.id);
        result = await fn(fd);
      } catch {
        result = { ok: false, error: "Couldn't save — try again" };
      }
      if (!result.ok) {
        error(result.error);
        router.refresh();
        return;
      }
      if (action.type !== "toggle" && result.message) success(result.message);
    });
  }

  const overlapIds = new Set<string>();
  for (let i = 0; i < blocks.length; i++) {
    for (let j = i + 1; j < blocks.length; j++) {
      if (blocksOverlap(blocks[i], blocks[j])) {
        overlapIds.add(blocks[i].id);
        overlapIds.add(blocks[j].id);
      }
    }
  }

  if (blocks.length === 0) {
    return (
      <EmptyState
        icon="calendar"
        title="No blocks scheduled"
        description="Your day is open. Add a block below, accept a suggestion or apply a template."
        actionLabel="Add a block"
        actionHref="#add-block"
      />
    );
  }

  // Blocks arrive sorted by start time; the now-line goes before the first block that starts later.
  const nowIndex =
    nowMinutes === null
      ? -1
      : (() => {
          const idx = blocks.findIndex((b) => (parseTimeToMinutes(b.startTime) ?? 0) > nowMinutes);
          return idx === -1 ? blocks.length : idx;
        })();

  return (
    <div className="relative space-y-3">
      <PendingIndicator pending={pending} />
      {blocks.map((block, index) => (
        <Fragment key={block.id}>
          {nowMinutes !== null && index === nowIndex && <NowLine minutes={nowMinutes} />}
          <BlockRow
            block={block}
            isToday={isToday}
            hasOverlap={overlapIds.has(block.id)}
            pending={pending}
            onToggle={(id) => run({ type: "toggle", id }, togglePlanBlockStatus)}
            onSkip={(id) => run({ type: "skip", id }, skipPlanBlock)}
            onDelete={(id) => run({ type: "delete", id }, deletePlanBlock)}
          />
        </Fragment>
      ))}
      {nowMinutes !== null && nowIndex === blocks.length && <NowLine minutes={nowMinutes} />}
    </div>
  );
}
