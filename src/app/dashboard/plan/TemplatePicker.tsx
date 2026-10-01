"use client";

import { useState } from "react";
import ActionForm from "@/components/ActionForm";
import SubmitButton from "@/components/SubmitButton";
import SubmitIconButton from "@/components/SubmitIconButton";
import EmptyState from "@/components/EmptyState";
import Icon from "@/components/Icon";
import type { PlanTemplateItem } from "@/lib/queries/plan";
import {
  applyPlanTemplate,
  copyYesterdayPlan,
  savePlanAsTemplate,
  deletePlanTemplate,
} from "./actions";

const WEEKDAYS = [
  { value: "", label: "Any day" },
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
  { value: "0", label: "Sunday" },
];

/** "Copy yesterday" — fills the selected day from the day before it. */
export function CopyPreviousDay({ dayValue, isToday }: { dayValue: string; isToday: boolean }) {
  return (
    <ActionForm action={copyYesterdayPlan}>
      <input type="hidden" name="planDate" value={dayValue} />
      <SubmitButton className="btn-ghost btn-sm min-h-[40px]" pendingLabel="Copying…">
        <Icon name="copy" className="h-3.5 w-3.5" />
        {isToday ? "Copy yesterday's plan" : "Copy previous day"}
      </SubmitButton>
    </ActionForm>
  );
}

type Props = {
  templates: PlanTemplateItem[];
  dayValue: string;
  blockCount: number;
};

export default function TemplatePicker({ templates, dayValue, blockCount }: Props) {
  const [showSave, setShowSave] = useState(false);

  return (
    <div className="card space-y-4">
      {templates.length === 0 ? (
        <EmptyState
          variant="inline"
          headingLevel="h3"
          icon="clipboard"
          title="No templates yet"
          description={
            blockCount > 0
              ? "Save this day's blocks as a template to reuse them on other days."
              : "Plan a day, then save it as a template to reuse it."
          }
        />
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-700">
          {templates.map((t) => {
            const weekday = t.dayOfWeek !== null ? WEEKDAYS.find((d) => d.value === String(t.dayOfWeek))?.label : null;
            return (
              <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-1.5 text-sm font-medium text-slate-800 dark:text-slate-100">
                    {t.name}
                    {t.isDefault && <span className="badge-brand">Default{weekday ? ` · ${weekday}` : ""}</span>}
                  </p>
                  <p className="text-xs text-muted">
                    {t.blockCount} block{t.blockCount === 1 ? "" : "s"}
                    {!t.isDefault && weekday && ` · ${weekday}`}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  <ActionForm action={applyPlanTemplate}>
                    <input type="hidden" name="planDate" value={dayValue} />
                    <input type="hidden" name="templateId" value={t.id} />
                    <SubmitButton className="btn-ghost btn-sm min-h-[40px]" aria-label={`Apply template “${t.name}”`}>
                      Apply
                    </SubmitButton>
                  </ActionForm>
                  {blockCount > 0 && (
                    <ActionForm
                      action={applyPlanTemplate}
                      confirm={{
                        title: `Replace this day with “${t.name}”?`,
                        message: `The ${blockCount} block${blockCount === 1 ? "" : "s"} already planned for this day will be removed first.`,
                        confirmLabel: "Replace day",
                      }}
                    >
                      <input type="hidden" name="planDate" value={dayValue} />
                      <input type="hidden" name="templateId" value={t.id} />
                      <input type="hidden" name="replace" value="true" />
                      <SubmitButton className="btn-danger btn-sm min-h-[40px]" aria-label={`Replace day with template “${t.name}”`}>
                        Replace day
                      </SubmitButton>
                    </ActionForm>
                  )}
                  <ActionForm
                    action={deletePlanTemplate}
                    confirm={{ title: `Delete template “${t.name}”?`, message: "Plans already made from it stay as they are." }}
                  >
                    <input type="hidden" name="id" value={t.id} />
                    <SubmitIconButton
                      className="btn-icon-danger"
                      icon={<Icon name="trash" className="h-4 w-4" />}
                      aria-label={`Delete template “${t.name}”`}
                    />
                  </ActionForm>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {blockCount > 0 && (
        <div className="border-t border-slate-100 pt-3 dark:border-slate-700">
          {!showSave ? (
            <button type="button" onClick={() => setShowSave(true)} className="btn-ghost btn-sm min-h-[40px]">
              <Icon name="plus" className="h-3.5 w-3.5" />
              Save this day as a template
            </button>
          ) : (
            <ActionForm
              action={savePlanAsTemplate}
              resetOnSuccess
              onSuccess={() => setShowSave(false)}
              className="grid grid-cols-1 gap-3"
            >
              <input type="hidden" name="planDate" value={dayValue} />
              <div>
                <label htmlFor="template-name" className="label">
                  Template name
                </label>
                <input id="template-name" name="name" className="input" placeholder="e.g. Workday" required />
              </div>
              <div>
                <label htmlFor="template-weekday" className="label">
                  Weekday
                </label>
                <select id="template-weekday" name="dayOfWeek" className="input" defaultValue="">
                  {WEEKDAYS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
              <label className="flex min-h-[40px] items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <input name="isDefault" type="checkbox" value="true" className="h-4 w-4" />
                Offer it on empty days of this weekday
              </label>
              <div className="flex flex-wrap gap-2">
                <SubmitButton className="btn-primary" pendingLabel="Saving…">
                  Save template
                </SubmitButton>
                <button type="button" className="btn-ghost" onClick={() => setShowSave(false)}>
                  Cancel
                </button>
              </div>
            </ActionForm>
          )}
        </div>
      )}
    </div>
  );
}
