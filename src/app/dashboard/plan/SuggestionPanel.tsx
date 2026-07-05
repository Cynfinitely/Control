"use client";

import SubmitButton from "@/components/SubmitButton";
import type { PlanSuggestion } from "@/lib/plan/suggestions";
import { acceptPlanSuggestion, dismissPlanSuggestion } from "./actions";

type Props = {
  suggestions: PlanSuggestion[];
  dayValue: string;
};

export default function SuggestionPanel({ suggestions, dayValue }: Props) {
  if (suggestions.length === 0) {
    return (
      <div className="card text-sm text-slate-400">
        No new suggestions — your plan looks complete for now.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {suggestions.map((s) => (
        <div key={s.key} className="card flex flex-wrap items-center justify-between gap-3 py-3">
          <div className="min-w-0 flex-1">
            <p className="font-medium text-slate-800">{s.title}</p>
            <p className="text-xs text-slate-500">
              {s.startTime} – {s.endTime} · {s.reason}
            </p>
          </div>
          <div className="flex gap-2">
            <form action={acceptPlanSuggestion}>
              <input type="hidden" name="planDate" value={dayValue} />
              <input type="hidden" name="title" value={s.title} />
              <input type="hidden" name="startTime" value={s.startTime} />
              <input type="hidden" name="endTime" value={s.endTime} />
              <input type="hidden" name="kind" value={s.kind} />
              {s.linkType && <input type="hidden" name="linkType" value={s.linkType} />}
              {s.linkId && <input type="hidden" name="linkId" value={s.linkId} />}
              <input type="hidden" name="suggestionKey" value={s.key} />
              <SubmitButton className="btn-primary text-xs">Accept</SubmitButton>
            </form>
            <form action={dismissPlanSuggestion}>
              <input type="hidden" name="planDate" value={dayValue} />
              <input type="hidden" name="suggestionKey" value={s.key} />
              <SubmitButton className="btn-ghost text-xs">Dismiss</SubmitButton>
            </form>
          </div>
        </div>
      ))}
    </div>
  );
}
