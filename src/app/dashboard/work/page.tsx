import { Suspense } from "react";
import { requireUser } from "@/lib/session";
import { toDateInputValue, formatDayLabel, parseDayParam } from "@/lib/date";
import { getWorkDay, getWorkLinkOptions } from "@/lib/queries/work";
import PageHeader from "@/components/PageHeader";
import DayNavigator from "@/components/DayNavigator";
import SubmitButton from "@/components/SubmitButton";
import FormAction from "@/components/FormAction";
import FocusTarget from "@/components/FocusTarget";
import FocusList from "./FocusList";
import { createFocusItemForm, saveWorkLogForm } from "./actions";

export default async function WorkPage({
  searchParams,
}: {
  searchParams: { day?: string; focus?: string };
}) {
  const user = await requireUser();
  const day = parseDayParam(searchParams.day);
  const dayValue = toDateInputValue(day);
  const dayLabel = formatDayLabel(day);

  const [workDay, linkOptions] = await Promise.all([
    getWorkDay(user.id, dayValue),
    getWorkLinkOptions(user.id),
  ]);

  const linkChoices = [...linkOptions.goals, ...linkOptions.skills];
  const doneCount = workDay.focusItems.filter((i) => i.status === "done").length;
  const totalCount = workDay.focusItems.length;

  return (
    <div>
      <PageHeader
        title="Work"
        description="Daily work focus — commit to a few outcomes, then log what actually happened."
      />

      <div className="card mb-6 flex flex-wrap items-center justify-between gap-3">
        <DayNavigator basePath="/dashboard/work" dayValue={dayValue} dayLabel={dayLabel} />
        {totalCount > 0 && (
          <p className="text-sm text-slate-500">
            {doneCount}/{totalCount} done
          </p>
        )}
      </div>

      <Suspense fallback={null}>
        <FocusTarget param="focus">
          <FormAction
            action={createFocusItemForm}
            successMessage="Focus item added"
            className="card mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
          >
            <input type="hidden" name="dayDate" value={dayValue} />
            <div className="sm:col-span-2 lg:col-span-4">
              <label htmlFor="work-focus-title" className="sr-only">
                Focus item
              </label>
              <input
                id="work-focus-title"
                name="title"
                className="input w-full"
                placeholder="What will you advance at work today?"
                required
                autoComplete="off"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label htmlFor="work-focus-link" className="label">
                Career link (optional)
              </label>
              <select id="work-focus-link" name="link" className="input" defaultValue="">
                <option value="">None</option>
                {linkChoices.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <SubmitButton className="btn-primary touch-target w-full">Add focus</SubmitButton>
            </div>
          </FormAction>
        </FocusTarget>
      </Suspense>

      <FocusList initialItems={workDay.focusItems} />

      <FormAction
        action={saveWorkLogForm}
        successMessage="Work log saved"
        className="card mt-8 space-y-4"
      >
        <input type="hidden" name="dayDate" value={dayValue} />
        <div>
          <h2 className="section-title mb-1">What actually happened</h2>
          <p className="mb-3 text-xs text-slate-400">
            Optional end-of-day log — wins, blockers, or notes from the workday.
          </p>
          <label htmlFor="work-log" className="sr-only">
            Work log
          </label>
          <textarea
            id="work-log"
            name="logNote"
            className="input"
            rows={4}
            placeholder="Shipped X, blocked on Y, next step Z…"
            defaultValue={workDay.logNote ?? ""}
          />
        </div>
        <SubmitButton className="btn-primary touch-target">Save log</SubmitButton>
      </FormAction>
    </div>
  );
}
