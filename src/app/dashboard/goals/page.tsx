import { requireUser } from "@/lib/session";
import { getPeriodKey, periodLabel, shiftPeriodDate, type GoalPeriod } from "@/lib/period";
import { getGoalsForPeriod } from "@/lib/queries/goals";
import PageHeader from "@/components/PageHeader";
import TabNav from "@/components/TabNav";
import StepNavigator from "@/components/StepNavigator";
import CollapsibleSection from "@/components/CollapsibleSection";
import FocusTarget from "@/components/FocusTarget";
import ActionForm from "@/components/ActionForm";
import SubmitButton from "@/components/SubmitButton";
import GoalList from "./GoalList";
import AddGoalForm from "./AddGoalForm";
import { rolloverGoals } from "./actions";

export const metadata = { title: "Goals" };

const PERIODS: { value: GoalPeriod; label: string; unit: string }[] = [
  { value: "weekly", label: "Weekly", unit: "week" },
  { value: "monthly", label: "Monthly", unit: "month" },
  { value: "yearly", label: "Yearly", unit: "year" },
];

export default async function GoalsPage({
  searchParams,
}: {
  searchParams: { period?: string; offset?: string };
}) {
  const user = await requireUser();
  const periodDef = PERIODS.find((p) => p.value === searchParams.period) ?? PERIODS[0];
  const period = periodDef.value;
  const offset = parseInt(searchParams.offset ?? "0", 10) || 0;
  const refDate = shiftPeriodDate(period, offset);
  const periodKey = getPeriodKey(period, refDate);
  const currentKey = getPeriodKey(period, new Date());
  const isCurrent = periodKey === currentKey;

  const goals = await getGoalsForPeriod(user.id, period, periodKey);

  // Rollover: from the previous period into the current one. Offered on the
  // previous period itself and on the current period, skipping goals that
  // were already carried over (same title).
  let carryFromKey: string | null = null;
  let carryCount = 0;
  if (offset === -1) {
    const currentGoals = await getGoalsForPeriod(user.id, period, currentKey);
    const carried = new Set(currentGoals.map((g) => g.title));
    carryFromKey = periodKey;
    carryCount = goals.filter((g) => g.status === "active" && !carried.has(g.title)).length;
  } else if (isCurrent) {
    const prevKey = getPeriodKey(period, shiftPeriodDate(period, -1));
    const prevGoals = await getGoalsForPeriod(user.id, period, prevKey);
    const carried = new Set(goals.map((g) => g.title));
    carryFromKey = prevKey;
    carryCount = prevGoals.filter((g) => g.status === "active" && !carried.has(g.title)).length;
  }

  const base = `/dashboard/goals?period=${period}`;
  const hrefFor = (o: number) => (o === 0 ? base : `${base}&offset=${o}`);
  const label = periodLabel(period, periodKey);

  return (
    <div>
      <PageHeader title="Goals" description={`${label} — checkboxes, counters, and milestones.`}>
        <TabNav
          aria-label="Goal period"
          variant="pills"
          className="mb-0"
          active={period}
          items={PERIODS.map((p) => ({ id: p.value, href: `/dashboard/goals?period=${p.value}`, label: p.label }))}
        />
      </PageHeader>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <StepNavigator
          label={label}
          sublabel={isCurrent ? `This ${periodDef.unit}` : undefined}
          prev={{ href: hrefFor(offset - 1), label: `Previous ${periodDef.unit}` }}
          next={{ href: hrefFor(offset + 1), label: `Next ${periodDef.unit}`, disabled: offset >= 0 }}
          reset={!isCurrent ? { href: base, label: `This ${periodDef.unit}`, text: `This ${periodDef.unit}` } : undefined}
        />
        {carryFromKey && carryCount > 0 && (
          <ActionForm action={rolloverGoals} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="period" value={period} />
            <input type="hidden" name="fromPeriodKey" value={carryFromKey} />
            <input type="hidden" name="toPeriodKey" value={currentKey} />
            {isCurrent && (
              <span className="text-sm text-muted">
                {carryCount} unfinished from last {periodDef.unit}
              </span>
            )}
            <SubmitButton className="btn-ghost btn-sm">
              {isCurrent
                ? `Carry ${carryCount} over`
                : `Carry ${carryCount} incomplete to this ${periodDef.unit}`}
            </SubmitButton>
          </ActionForm>
        )}
      </div>

      <FocusTarget value="add">
        <CollapsibleSection title="Add goal" variant="card" className="mb-6">
          <AddGoalForm period={period} periodKey={periodKey} />
        </CollapsibleSection>
      </FocusTarget>

      <GoalList initialGoals={goals} addHref={`${hrefFor(offset)}&focus=add`} />
    </div>
  );
}
