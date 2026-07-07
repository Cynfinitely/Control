import { requireUser } from "@/lib/session";
import { toDateInputValue, formatDayLabel, parseDayParam } from "@/lib/date";
import {
  getDayPlanBlocks,
  getPlanTemplates,
  getDismissedSuggestionKeys,
  getPlanDayStats,
} from "@/lib/queries/plan";
import { getPlanSuggestions } from "@/lib/plan/suggestions";
import PageHeader from "@/components/PageHeader";
import DayNavigator from "@/components/DayNavigator";
import SubmitButton from "@/components/SubmitButton";
import PlanTimeline from "./PlanTimeline";
import SuggestionPanel from "./SuggestionPanel";
import TemplatePicker from "./TemplatePicker";
import PlanTextImport from "./PlanTextImport";
import { createPlanBlock, applyPlanTemplate } from "./actions";
import { PLAN_KIND_LABELS } from "@/lib/plan/kinds";

export default async function PlanPage({
  searchParams,
}: {
  searchParams: { day?: string };
}) {
  const user = await requireUser();
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

  const suggestions = await getPlanSuggestions(user.id, dayValue, dismissedKeys);

  const defaultTemplate = templates.find(
    (t) => t.isDefault && t.dayOfWeek === day.getDay()
  );

  return (
    <div>
      <PageHeader
        title="Daily plan"
        description="Time-block your day — schedule tasks, meals, prayers, and more."
      />

      <div className="card mb-6">
        <DayNavigator basePath="/dashboard/plan" dayValue={dayValue} dayLabel={dayLabel} />
        {stats.totalBlocks > 0 && (
          <p className="mt-2 text-sm text-slate-500">
            {stats.doneBlocks}/{stats.totalBlocks} done · {stats.completionPct}% complete
            {stats.hasOverlaps && " · overlaps detected"}
          </p>
        )}
      </div>

      {blocks.length === 0 && defaultTemplate && (
        <div className="card mb-6 border-brand-200 bg-brand-50/50">
          <p className="text-sm text-slate-700">
            Empty day — apply your default template &quot;{defaultTemplate.name}&quot;?
          </p>
          <form action={applyPlanTemplate} className="mt-2">
            <input type="hidden" name="planDate" value={dayValue} />
            <input type="hidden" name="templateId" value={defaultTemplate.id} />
            <SubmitButton className="btn-primary text-sm">Apply default template</SubmitButton>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="section-title mb-3">Timeline</h2>
          <PlanTimeline
            initialBlocks={blocks}
            dayValue={dayValue}
            isToday={isToday}
            showCurrentTimeLine
          />

          <h2 className="section-title mb-3 mt-8" id="add-block">Add block</h2>
          <form action={createPlanBlock} className="card grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input type="hidden" name="planDate" value={dayValue} />
            <input name="title" className="input sm:col-span-2" placeholder="Block title" required />
            <div>
              <label className="label">Start</label>
              <input name="startTime" type="time" className="input" defaultValue="09:00" required />
            </div>
            <div>
              <label className="label">End</label>
              <input name="endTime" type="time" className="input" defaultValue="10:00" required />
            </div>
            <div>
              <label className="label">Kind</label>
              <select name="kind" className="input" defaultValue="custom">
                {Object.entries(PLAN_KIND_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Notes</label>
              <input name="notes" className="input" placeholder="Optional" />
            </div>
            <div className="sm:col-span-2">
              <SubmitButton className="btn-primary touch-target w-full sm:w-auto">Add block</SubmitButton>
            </div>
          </form>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="section-title mb-3">Smart suggestions</h2>
            <SuggestionPanel suggestions={suggestions} dayValue={dayValue} />
          </div>

          <div>
            <h2 className="section-title mb-3">Templates</h2>
            <TemplatePicker templates={templates} dayValue={dayValue} blockCount={blocks.length} />
          </div>

          <div>
            <PlanTextImport dayValue={dayValue} />
          </div>
        </div>
      </div>
    </div>
  );
}
