"use client";

import { useState } from "react";
import SubmitButton from "@/components/SubmitButton";
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

type Props = {
  templates: PlanTemplateItem[];
  dayValue: string;
  blockCount: number;
};

export default function TemplatePicker({ templates, dayValue, blockCount }: Props) {
  const [showSave, setShowSave] = useState(false);

  return (
    <div className="space-y-4">
      <div className="card">
        <h3 className="mb-2 text-sm font-semibold text-slate-700">Quick actions</h3>
        <div className="flex flex-wrap gap-2">
          <form action={copyYesterdayPlan}>
            <input type="hidden" name="planDate" value={dayValue} />
            <SubmitButton className="btn-ghost text-xs">Copy yesterday</SubmitButton>
          </form>
          {blockCount > 0 && (
            <button
              type="button"
              onClick={() => setShowSave((v) => !v)}
              className="btn-ghost text-xs"
            >
              Save as template
            </button>
          )}
        </div>

        {showSave && blockCount > 0 && (
          <form action={savePlanAsTemplate} className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <input type="hidden" name="planDate" value={dayValue} />
            <input name="name" className="input sm:col-span-2" placeholder="Template name" required />
            <select name="dayOfWeek" className="input" defaultValue="">
              {WEEKDAYS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input name="isDefault" type="checkbox" value="true" />
              Default for this weekday
            </label>
            <SubmitButton className="btn-primary sm:col-span-2">Save template</SubmitButton>
          </form>
        )}
      </div>

      {templates.length > 0 && (
        <div className="card">
          <h3 className="mb-2 text-sm font-semibold text-slate-700">Templates</h3>
          <div className="space-y-2">
            {templates.map((t) => (
              <div key={t.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-slate-800">{t.name}</p>
                  <p className="text-xs text-slate-400">
                    {t.blockCount} blocks
                    {t.isDefault && " · default"}
                    {t.dayOfWeek !== null && ` · ${WEEKDAYS.find((d) => d.value === String(t.dayOfWeek))?.label}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <form action={applyPlanTemplate}>
                    <input type="hidden" name="planDate" value={dayValue} />
                    <input type="hidden" name="templateId" value={t.id} />
                    <SubmitButton className="btn-ghost text-xs">Apply</SubmitButton>
                  </form>
                  <form action={applyPlanTemplate}>
                    <input type="hidden" name="planDate" value={dayValue} />
                    <input type="hidden" name="templateId" value={t.id} />
                    <input type="hidden" name="replace" value="true" />
                    <SubmitButton className="btn-ghost text-xs">Replace day</SubmitButton>
                  </form>
                  <form action={deletePlanTemplate}>
                    <input type="hidden" name="id" value={t.id} />
                    <SubmitButton className="btn-ghost text-xs text-red-600">Delete</SubmitButton>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
