import { Suspense } from "react";
import { getDisabledModules } from "@/lib/queries/modules";
import { requireModule } from "@/lib/session";
import { toDateInputValue, formatDayLabel, parseDayParam } from "@/lib/date";
import { getWorkDay, getWorkLinkOptions } from "@/lib/queries/work";
import PageHeader from "@/components/PageHeader";
import DayNavigator from "@/components/DayNavigator";
import SubmitButton from "@/components/SubmitButton";
import FormAction from "@/components/FormAction";
import FocusTarget from "@/components/FocusTarget";
import FocusList from "./FocusList";
import WorkLogForm from "./WorkLogForm";
import { createFocusItemForm } from "./actions";

export const metadata = { title: "Work" };

export default async function WorkPage({
  searchParams,
}: {
  searchParams: { day?: string; focus?: string };
}) {
  const user = await requireModule("work");
  const day = parseDayParam(searchParams.day);
  const dayValue = toDateInputValue(day);
  const dayLabel = formatDayLabel(day);

  const [workDay, linkOptions] = await Promise.all([
    getWorkDay(user.id, dayValue),
    getWorkLinkOptions(user.id),
  ]);

  // Career links are only offered while the Career module is on.
  const careerOn = !(await getDisabledModules(user.id)).includes("career");
  const linkChoices = careerOn ? [...linkOptions.goals, ...linkOptions.skills] : [];
  const doneCount = workDay.focusItems.filter((i) => i.status === "done").length;
  const totalCount = workDay.focusItems.length;

  return (
    <div>
      <PageHeader help="work"
        title="Work"
        description="Daily work focus — commit to a few outcomes, then log what actually happened."
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <DayNavigator basePath="/dashboard/work" dayValue={dayValue} dayLabel={dayLabel} />
        {totalCount > 0 && (
          <p className="text-sm text-muted">
            {doneCount}/{totalCount} done
          </p>
        )}
      </div>

      <Suspense fallback={null}>
        <FocusTarget param="focus">
          <FormAction
            action={createFocusItemForm}
            successMessage="Focus item added"
            resetOnSuccess
            className="card mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
          >
            <input type="hidden" name="dayDate" value={dayValue} />
            <div className="sm:col-span-2 lg:col-span-4">
              <label htmlFor="work-focus-title" className="label">
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
            <div className={careerOn ? "sm:col-span-2 lg:col-span-3" : "hidden"}>
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

      <WorkLogForm key={dayValue} dayValue={dayValue} initialNote={workDay.logNote ?? ""} />
    </div>
  );
}
