"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import FormAction from "@/components/FormAction";
import ActionForm from "@/components/ActionForm";
import SubmitButton from "@/components/SubmitButton";
import SubmitIconButton from "@/components/SubmitIconButton";
import IconButton from "@/components/IconButton";
import CollapsibleSection from "@/components/CollapsibleSection";
import Icon from "@/components/Icon";
import Spinner from "@/components/Spinner";
import EmptyState from "@/components/EmptyState";
import { useToast } from "@/components/Toast";
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
  const [isMoving, startTransition] = useTransition();
  const [movingId, setMovingId] = useState<string | null>(null);
  const router = useRouter();
  const toast = useToast();
  const atCap = priorities.length >= MAX_LIFE_PRIORITIES;

  function runMove(id: string, title: string, direction: "up" | "down") {
    setMovingId(id);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", id);
      fd.set("direction", direction);
      try {
        const result = await movePriority(fd);
        if (!result.ok) toast.error(result.error);
      } catch {
        toast.error(`Couldn't move “${title}”. Please try again.`);
      } finally {
        router.refresh();
        setMovingId(null);
      }
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
          <h2 className="section-title">Add a priority</h2>
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
        <p className="mb-6 flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:bg-slate-900/40 dark:text-slate-300">
          <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" />
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
                <CollapsibleSection title="Edit" className="mt-1 text-sm">
                  <FormAction
                    action={updatePriorityForm}
                    successMessage="Priority updated"
                    className="space-y-3"
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
                </CollapsibleSection>
              </div>
              <div className="flex shrink-0 items-center" aria-busy={movingId === item.id || undefined}>
                {movingId === item.id && <Spinner className="mr-1 h-4 w-4 text-brand-600" />}
                <IconButton
                  icon="chevronUp"
                  disabled={index === 0 || isMoving}
                  onClick={() => runMove(item.id, item.title, "up")}
                  aria-label={`Move ${item.title} up`}
                />
                <IconButton
                  icon="chevronDown"
                  disabled={index === priorities.length - 1 || isMoving}
                  onClick={() => runMove(item.id, item.title, "down")}
                  aria-label={`Move ${item.title} down`}
                />
                <ActionForm
                  action={deletePriority}
                  confirm={{
                    title: `Remove “${item.title}”?`,
                    message: "It will be removed from your life ranking.",
                    confirmLabel: "Remove",
                  }}
                  successMessage="Priority removed"
                >
                  <input type="hidden" name="id" value={item.id} />
                  <SubmitIconButton
                    icon={<Icon name="trash" className="h-4 w-4" />}
                    aria-label={`Remove priority ${item.title}`}
                    className="btn-icon-danger"
                  />
                </ActionForm>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
