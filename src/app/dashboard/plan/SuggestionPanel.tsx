"use client";

import ActionForm from "@/components/ActionForm";
import SubmitButton from "@/components/SubmitButton";
import EmptyState from "@/components/EmptyState";
import type { PlanSuggestion } from "@/lib/plan/suggestions";
import { acceptPlanSuggestion, dismissPlanSuggestion } from "./actions";

type Props = {
  suggestions: PlanSuggestion[];
  dayValue: string;
};

export default function SuggestionPanel({ suggestions, dayValue }: Props) {
  if (suggestions.length === 0) {
    return (
      <div className="card">
        <EmptyState
          variant="inline"
          headingLevel="h3"
          icon="sparkles"
          title="No new suggestions"
          description="Your plan looks complete for now."
        />
      </div>
    );
  }

  return (
    <ul className="card-flush divide-y divide-slate-100 dark:divide-slate-700">
      {suggestions.map((s) => (
        <li key={s.key} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="font-medium text-slate-800 dark:text-slate-100">{s.title}</p>
            <p className="text-xs text-muted">
              <span className="tabular-nums">
                {s.startTime} – {s.endTime}
              </span>{" "}
              · {s.reason}
            </p>
          </div>
          <div className="flex gap-1">
            <ActionForm action={acceptPlanSuggestion}>
              <input type="hidden" name="planDate" value={dayValue} />
              <input type="hidden" name="title" value={s.title} />
              <input type="hidden" name="startTime" value={s.startTime} />
              <input type="hidden" name="endTime" value={s.endTime} />
              <input type="hidden" name="kind" value={s.kind} />
              {s.linkType && <input type="hidden" name="linkType" value={s.linkType} />}
              {s.linkId && <input type="hidden" name="linkId" value={s.linkId} />}
              <input type="hidden" name="suggestionKey" value={s.key} />
              <SubmitButton className="btn-ghost btn-sm min-h-[40px]" aria-label={`Add “${s.title}” to the plan`}>
                Add
              </SubmitButton>
            </ActionForm>
            <ActionForm action={dismissPlanSuggestion}>
              <input type="hidden" name="planDate" value={dayValue} />
              <input type="hidden" name="suggestionKey" value={s.key} />
              <SubmitButton className="btn-ghost btn-sm min-h-[40px]" aria-label={`Dismiss suggestion “${s.title}”`}>
                Dismiss
              </SubmitButton>
            </ActionForm>
          </div>
        </li>
      ))}
    </ul>
  );
}
