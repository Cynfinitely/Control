"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import FormAction from "@/components/FormAction";
import SubmitButton from "@/components/SubmitButton";
import DeleteConfirmButton from "@/components/DeleteConfirmButton";
import Icon from "@/components/Icon";
import EmptyState from "@/components/EmptyState";
import type { LifePriorityItem } from "@/lib/queries/priorities";
import { MAX_LIFE_PRIORITIES } from "@/lib/priorities/rank";
import {
  createPriorityForm,
  updatePriorityForm,
  deletePriority,
  movePriority,
} from "./actions";

type Props = {
  priorities: LifePriorityItem[];
};

export default function PrioritiesManager({ priorities }: Props) {
  const [, startTransition] = useTransition();
  const router = useRouter();
  const atCap = priorities.length >= MAX_LIFE_PRIORITIES;

  function runMove(id: string, direction: "up" | "down") {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", id);
      fd.set("direction", direction);
      await movePriority(fd);
      router.refresh();
    });
  }

  return (
    <div>
      {!atCap && (
        <FormAction
          action={createPriorityForm}
          successMessage="Priority added"
          resetOnSuccess
          className="card mb-6 space-y-3"
        >
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Add a priority</p>
          <div>
            <label htmlFor="priority-title" className="label">
              Title
            </label>
            <input
              id="priority-title"
              name="title"
              className="input"
              placeholder="e.g. Religion, Health, Family"
              required
              autoComplete="off"
            />
          </div>
          <div>
            <label htmlFor="priority-note" className="label">
              Note (optional)
            </label>
            <input
              id="priority-note"
              name="note"
              className="input"
              placeholder="Why this comes first…"
              autoComplete="off"
            />
          </div>
          <SubmitButton className="btn-primary">Add priority</SubmitButton>
        </FormAction>
      )}

      {atCap && (
        <p className="mb-6 text-sm text-slate-500">
          You&apos;ve reached the maximum of {MAX_LIFE_PRIORITIES} priorities. Remove one to add another.
        </p>
      )}

      {priorities.length === 0 ? (
        <EmptyState
          icon="flag"
          title="Rank what matters most"
          description="This is the order of your life — not todo urgency. Put religion, health, family, or whatever you serve first."
          tip="Keep it short. Five to seven items is usually enough."
        />
      ) : (
        <ol className="space-y-2">
          {priorities.map((item, index) => (
            <li
              key={item.id}
              className="card flex items-start gap-3 py-4"
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold tabular-nums text-brand-700 dark:bg-brand-950 dark:text-brand-300"
                aria-hidden
              >
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-800 dark:text-slate-100">{item.title}</p>
                {item.note && (
                  <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{item.note}</p>
                )}
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-brand-600">Edit</summary>
                  <FormAction
                    action={updatePriorityForm}
                    successMessage="Priority updated"
                    className="mt-3 space-y-3"
                  >
                    <input type="hidden" name="id" value={item.id} />
                    <div>
                      <label htmlFor={`priority-title-${item.id}`} className="label">
                        Title
                      </label>
                      <input
                        id={`priority-title-${item.id}`}
                        name="title"
                        className="input"
                        required
                        defaultValue={item.title}
                      />
                    </div>
                    <div>
                      <label htmlFor={`priority-note-${item.id}`} className="label">
                        Note (optional)
                      </label>
                      <input
                        id={`priority-note-${item.id}`}
                        name="note"
                        className="input"
                        defaultValue={item.note ?? ""}
                      />
                    </div>
                    <SubmitButton className="btn-primary">Save changes</SubmitButton>
                  </FormAction>
                </details>
              </div>
              <div className="flex shrink-0 flex-col gap-1">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => runMove(item.id, "up")}
                  className="touch-target flex h-9 w-9 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                  aria-label={`Move ${item.title} up`}
                >
                  <Icon name="chevronUp" className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  disabled={index === priorities.length - 1}
                  onClick={() => runMove(item.id, "down")}
                  className="touch-target flex h-9 w-9 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                  aria-label={`Move ${item.title} down`}
                >
                  <Icon name="chevronDown" className="h-4 w-4" />
                </button>
              </div>
              <DeleteConfirmButton
                title="Remove priority?"
                message={`Remove "${item.title}" from your life ranking?`}
                label="Remove priority"
                onConfirm={() => {
                  startTransition(async () => {
                    const fd = new FormData();
                    fd.set("id", item.id);
                    await deletePriority(fd);
                    router.refresh();
                  });
                }}
              />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
