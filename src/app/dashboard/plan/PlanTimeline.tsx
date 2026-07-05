"use client";

import { useOptimistic, useTransition, useState } from "react";
import Link from "next/link";
import Icon from "@/components/Icon";
import SubmitButton from "@/components/SubmitButton";
import { kindColor, PLAN_KIND_LABELS, PLAN_KIND_LINKS, type PlanKind } from "@/lib/plan/kinds";
import { isBlockActive, isBlockOverdue } from "@/lib/plan/time";
import { blocksOverlap } from "@/lib/plan/overlap";
import type { PlanBlockItem } from "@/lib/queries/plan";
import {
  togglePlanBlockStatus,
  skipPlanBlock,
  deletePlanBlock,
  updatePlanBlock,
} from "./actions";

type Props = {
  initialBlocks: PlanBlockItem[];
  dayValue: string;
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
  const moduleLink = PLAN_KIND_LINKS[block.kind as PlanKind];

  return (
    <div
      className={`card border-l-4 py-3 ${kindColor(block.kind, block.color)} ${active ? "ring-2 ring-brand-400" : ""} ${isDone || isSkipped ? "opacity-70" : ""} ${hasOverlap ? "border-r-4 border-r-red-400" : ""}`}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          disabled={pending || isSkipped}
          onClick={() => onToggle(block.id)}
          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${
            isDone ? "border-green-500 bg-green-500 text-white" : "border-slate-300 bg-white"
          }`}
          aria-label={isDone ? "Mark planned" : "Mark done"}
        >
          {isDone && <Icon name="check" className="h-3.5 w-3.5" />}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`font-medium ${isDone ? "line-through" : ""}`}>{block.title}</span>
            <span className="rounded bg-white/60 px-1.5 py-0.5 text-xs">
              {PLAN_KIND_LABELS[block.kind as PlanKind] ?? block.kind}
            </span>
            {overdue && (
              <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-700">Running behind</span>
            )}
            {hasOverlap && (
              <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-700">Overlap</span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-slate-600">
            {block.startTime} – {block.endTime}
          </p>
          {block.notes && <p className="mt-1 text-xs text-slate-500">{block.notes}</p>}
          {moduleLink && (
            <Link href={moduleLink} className="mt-1 inline-block text-xs text-brand-600">
              Open in module →
            </Link>
          )}
        </div>

        <div className="flex shrink-0 gap-1">
          {!isDone && !isSkipped && (
            <button
              type="button"
              disabled={pending}
              onClick={() => onSkip(block.id)}
              className="btn-ghost touch-target px-2 text-xs"
            >
              Skip
            </button>
          )}
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="btn-ghost touch-target px-2 text-xs"
          >
            Edit
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => onDelete(block.id)}
            className="touch-target text-slate-300 hover:text-red-500"
            aria-label="Delete"
          >
            <Icon name="trash" className="h-4 w-4" />
          </button>
        </div>
      </div>

      {editing && (
        <form
          action={updatePlanBlock}
          className="mt-3 grid grid-cols-1 gap-2 border-t border-slate-200/60 pt-3 sm:grid-cols-2"
          onSubmit={() => setEditing(false)}
        >
          <input type="hidden" name="id" value={block.id} />
          <input name="title" className="input sm:col-span-2" defaultValue={block.title} required />
          <input name="startTime" type="time" className="input" defaultValue={block.startTime} required />
          <input name="endTime" type="time" className="input" defaultValue={block.endTime} required />
          <select name="kind" className="input" defaultValue={block.kind}>
            {Object.entries(PLAN_KIND_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <input name="notes" className="input" defaultValue={block.notes ?? ""} placeholder="Notes" />
          <SubmitButton className="btn-primary sm:col-span-2">Save</SubmitButton>
        </form>
      )}
    </div>
  );
}

export default function PlanTimeline({ initialBlocks, dayValue, isToday, showCurrentTimeLine }: Props) {
  const [pending, startTransition] = useTransition();
  const [blocks, setOptimistic] = useOptimistic(initialBlocks, applyOptimistic);

  function run(action: OptimisticAction, fn: (fd: FormData) => Promise<void>) {
    startTransition(async () => {
      setOptimistic(action);
      const fd = new FormData();
      fd.set("id", action.id);
      await fn(fd);
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
      <div className="card py-8 text-center text-sm text-slate-400">
        No blocks scheduled for this day. Add one below or accept suggestions.
      </div>
    );
  }

  return (
    <div className="relative space-y-3">
      {showCurrentTimeLine && isToday && (
        <div className="mb-2 flex items-center gap-2 text-xs text-brand-600">
          <span className="inline-block h-2 w-2 rounded-full bg-brand-500" />
          Current time indicator active
        </div>
      )}
      {blocks.map((block) => (
        <BlockRow
          key={block.id}
          block={block}
          isToday={isToday}
          hasOverlap={overlapIds.has(block.id)}
          pending={pending}
          onToggle={(id) => run({ type: "toggle", id }, togglePlanBlockStatus)}
          onSkip={(id) => run({ type: "skip", id }, skipPlanBlock)}
          onDelete={(id) => run({ type: "delete", id }, deletePlanBlock)}
        />
      ))}
      <input type="hidden" name="planDate" value={dayValue} />
    </div>
  );
}
