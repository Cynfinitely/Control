import { requireModule } from "@/lib/session";
import { toDateInputValue, formatDayLabel, parseDayParam } from "@/lib/date";
import {
  getDayPlanBlocks,
  getPlanTemplates,
  getDismissedSuggestionKeys,
  getPlanDayStats,
} from "@/lib/queries/plan";
import { getPlanSuggestions } from "@/lib/plan/suggestions";
import { Suspense } from "react";
import PageHeader from "@/components/PageHeader";
import DayNavigator from "@/components/DayNavigator";
import SubmitButton from "@/components/SubmitButton";
import ActionForm from "@/components/ActionForm";
import FocusTarget from "@/components/FocusTarget";
import Icon from "@/components/Icon";
import PlanTimeline from "./PlanTimeline";
import SuggestionPanel from "./SuggestionPanel";
import TemplatePicker, { CopyPreviousDay } from "./TemplatePicker";
import PlanTextImport from "./PlanTextImport";
import { createPlanBlock, applyPlanTemplate } from "./actions";
import { PLAN_KIND_LABELS, PLAN_KIND_MODULES, type PlanKind } from "@/lib/plan/kinds";
import { getDisabledModules } from "@/lib/queries/modules";
import { moduleFilter } from "@/lib/modules";

export const metadata = { title: "Daily plan" };

export default async function PlanPage({
  searchParams,
}: {
  searchParams: { day?: string; focus?: string };
}) {
  const user = await requireModule("plan");
  const day = parseDayParam(searchParams.day);
  const dayValue = toDateInputValue(day);
  const dayLabel = formatDayLabel(day);
  const todayValue = toDateInputValue(new Date());
  const isToday = dayValue === todayValue;

  const [blocks, templates, dismissedKeys, stats] = await Promise.all([
    getDayPlanBlocks(user.id, dayValue),
    getPlanTemplates(user.id),
    getDismissedSuggestionKeys(user.id, dayValue),
    getPlanDayStats(user.id, dayValue),
  ]);

  // Only suggest blocks from modules that are switched on.
  const modules = moduleFilter(await getDisabledModules(user.id));
  const suggestions = (await getPlanSuggestions(user.id, dayValue, dismissedKeys)).filter((s) => {
    const kindModule = PLAN_KIND_MODULES[s.kind as PlanKind];
    return !kindModule || modules.has(kindModule);
  });

  const defaultTemplate = templates.find(
    (t) => t.isDefault && t.dayOfWeek === day.getDay()
  );

  return (
    <div>
      <PageHeader
        title="Daily plan"
        description="Time-block your day — schedule tasks, meals, prayers, and more."
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <DayNavigator basePath="/dashboard/plan" dayValue={dayValue} dayLabel={dayLabel} />
        {stats.totalBlocks > 0 && (
          <p className="flex flex-wrap items-center gap-2 text-sm text-muted">
            <span>
              {stats.doneBlocks}/{stats.totalBlocks} done · {stats.completionPct}% complete
            </span>
            {stats.hasOverlaps && (
              <span className="badge-danger">
                <Icon name="alert" className="h-3 w-3" />
                Overlaps detected
              </span>
            )}
          </p>
        )}
      </div>

      {blocks.length === 0 && defaultTemplate && (
        <section className="card mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" aria-label="Default template">
          <div className="flex min-w-0 items-start gap-3">
            <Icon name="clipboard" className="mt-0.5 h-5 w-5 shrink-0 text-brand-600 dark:text-brand-400" />
            <p className="text-sm text-slate-700 dark:text-slate-200">
              This day is empty. Start from your default template{" "}
              <span className="font-medium">“{defaultTemplate.name}”</span> ({defaultTemplate.blockCount} block
              {defaultTemplate.blockCount === 1 ? "" : "s"})?
            </p>
          </div>
          <ActionForm action={applyPlanTemplate} className="shrink-0">
            <input type="hidden" name="planDate" value={dayValue} />
            <input type="hidden" name="templateId" value={defaultTemplate.id} />
            <SubmitButton className="btn-primary" pendingLabel="Applying…">
              Apply template
            </SubmitButton>
          </ActionForm>
        </section>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <h2 className="section-title mb-3">Timeline</h2>
          <PlanTimeline initialBlocks={blocks} isToday={isToday} showCurrentTimeLine />

          <h2 className="section-title mb-3 mt-8 scroll-mt-6" id="add-block">
            Add block
          </h2>
          <Suspense fallback={null}>
            <FocusTarget value="add">
              <ActionForm
                action={createPlanBlock}
                resetOnSuccess
                className="card grid grid-cols-1 gap-3 sm:grid-cols-2"
              >
                <input type="hidden" name="planDate" value={dayValue} />
                <div className="sm:col-span-2">
                  <label htmlFor="plan-title" className="label">
                    Title
                  </label>
                  <input id="plan-title" name="title" className="input" placeholder="e.g. Deep work" required autoComplete="off" />
                </div>
                <div>
                  <label htmlFor="plan-start" className="label">
                    Start
                  </label>
                  <input id="plan-start" name="startTime" type="time" className="input" defaultValue="09:00" required />
                </div>
                <div>
                  <label htmlFor="plan-end" className="label">
                    End
                  </label>
                  <input id="plan-end" name="endTime" type="time" className="input" defaultValue="10:00" required />
                </div>
                <div>
                  <label htmlFor="plan-kind" className="label">
                    Kind
                  </label>
                  <select id="plan-kind" name="kind" className="input" defaultValue="custom">
                    {Object.entries(PLAN_KIND_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="plan-notes" className="label">
                    Notes
                  </label>
                  <input id="plan-notes" name="notes" className="input" placeholder="Optional" />
                </div>
                <div className="sm:col-span-2">
                  <SubmitButton className="btn-primary touch-target w-full sm:w-auto" pendingLabel="Adding…">
                    Add block
                  </SubmitButton>
                </div>
              </ActionForm>
            </FocusTarget>
          </Suspense>
        </div>

        <div className="min-w-0 space-y-6">
          <section>
            <h2 className="section-title mb-3">Smart suggestions</h2>
            <SuggestionPanel suggestions={suggestions} dayValue={dayValue} />
          </section>

          <section>
            <h2 className="section-title mb-3">Quick start</h2>
            <div className="card">
              <p className="mb-3 text-sm text-muted">Reuse the day before as a starting point.</p>
              <CopyPreviousDay dayValue={dayValue} isToday={isToday} />
            </div>
          </section>

          <section>
            <h2 className="section-title mb-3">Templates</h2>
            <TemplatePicker templates={templates} dayValue={dayValue} blockCount={blocks.length} />
          </section>

          <PlanTextImport dayValue={dayValue} blockCount={blocks.length} />
        </div>
      </div>
    </div>
  );
}
