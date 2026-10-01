import Link from "next/link";
import clsx from "clsx";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { getPeriodKey } from "@/lib/period";
import { startOfWeek, addDays, toDateInputValue, formatDate, endOfDay } from "@/lib/date";
import { historicalDebtRemaining } from "@/lib/prayer-debt";
import { getBacklogTodos, getStaleOpenTodoCount } from "@/lib/queries/todos";
import { getGoalsForPeriod } from "@/lib/queries/goals";
import { getWeekExpenseTotal } from "@/lib/queries/budget";
import { getOverduePeople } from "@/lib/queries/networking";
import { formatEuro } from "@/lib/budget";
import { REVIEW_STEPS, parseCompletedSteps, reviewProgress, type ReviewStepId } from "@/lib/review";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import EmptyState from "@/components/EmptyState";
import StaleBacklogButton from "@/components/StaleBacklogButton";
import GoalList from "../goals/GoalList";
import ReviewStepCheck from "./ReviewStepCheck";
import ReviewNotes from "./ReviewNotes";
import ReviewCompleteButton from "./ReviewCompleteButton";

export const metadata = { title: "Weekly review" };

const stepAnchor = (id: ReviewStepId) => `step-${id}`;

export default async function WeeklyReviewPage() {
  const user = await requireUser();
  const now = new Date();
  // getPeriodKey/startOfWeek mutate a Date argument; pass copies so `now` stays intact.
  const weekKey = getPeriodKey("weekly", new Date(now));
  const weekStart = startOfWeek(new Date(now));
  const weekEnd = endOfDay(addDays(weekStart, 6));

  const [
    backlog,
    staleCount,
    goals,
    pendingQazaDaily,
    prayerDebts,
    overduePeople,
    shoppingRemaining,
    weekExpensesCents,
    review,
    lastCompleted,
  ] = await Promise.all([
    getBacklogTodos(user.id),
    getStaleOpenTodoCount(user.id),
    getGoalsForPeriod(user.id, "weekly", weekKey),
    prisma.qazaPrayer.count({ where: { userId: user.id, fulfilledAt: null } }),
    prisma.prayerDebt.findMany({ where: { userId: user.id } }),
    getOverduePeople(user.id, now, 10),
    prisma.shoppingItem.count({
      where: {
        checked: false,
        mealPlanItem: {
          userId: user.id,
          deletedAt: null,
          date: { gte: weekStart, lte: addDays(weekStart, 6) },
        },
      },
    }),
    getWeekExpenseTotal(user.id, weekStart, weekEnd),
    prisma.weeklyReview.findUnique({
      where: { userId_weekKey: { userId: user.id, weekKey } },
      select: { completedSteps: true, notes: true, completedAt: true },
    }),
    prisma.weeklyReview.findFirst({
      where: { userId: user.id, completedAt: { not: null } },
      orderBy: { completedAt: "desc" },
      select: { completedAt: true },
    }),
  ]);

  const pendingQaza = pendingQazaDaily + historicalDebtRemaining(prayerDebts);
  const completedGoals = goals.filter((g) => g.status === "completed").length;
  const activeGoals = goals.length - completedGoals;

  const doneSteps = parseCompletedSteps(review?.completedSteps);
  const progress = reviewProgress(doneSteps);
  const remaining = progress.total - progress.done;
  const isCompleted = Boolean(review?.completedAt);
  const pct = Math.round((progress.done / progress.total) * 100);

  const description = [
    `Week of ${formatDate(weekStart)}`,
    lastCompleted?.completedAt ? `Last completed ${formatDate(lastCompleted.completedAt)}` : "Not completed yet",
  ].join(" · ");

  const stepBody: Record<ReviewStepId, React.ReactNode> = {
    inbox: (
      <div className="space-y-4">
        {staleCount > 0 ? (
          <StaleBacklogButton count={staleCount} className="btn-ghost" />
        ) : (
          <p className="text-sm text-muted">No stale open todos — you&apos;re caught up.</p>
        )}
        <div>
          <h3 className="subsection-title mb-2">Backlog ({backlog.length})</h3>
          {backlog.length === 0 ? (
            <EmptyState variant="inline" headingLevel="h3" icon="check" title="Backlog is empty — nice work" />
          ) : (
            <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-300">
              {backlog.slice(0, 8).map((t) => (
                <li key={t.id}>{t.title}</li>
              ))}
              {backlog.length > 8 && <li className="list-none text-muted">…and {backlog.length - 8} more</li>}
            </ul>
          )}
        </div>
        <Link href="/dashboard/todos" className="link inline-flex min-h-[36px] items-center text-sm">
          Open todos →
        </Link>
      </div>
    ),
    goals:
      goals.length === 0 ? (
        <EmptyState
          variant="inline"
          headingLevel="h3"
          icon="target"
          title="No goals this week"
          description="Set one or two goals to steer the week."
          actionLabel="Add a weekly goal"
          actionHref="/dashboard/goals?period=weekly&focus=add"
        />
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted">
            {completedGoals} completed · {activeGoals} still active this week.
          </p>
          <div className="tile overflow-hidden p-0">
            <GoalList initialGoals={goals} compact />
          </div>
          <Link href="/dashboard/goals" className="link inline-flex min-h-[36px] items-center text-sm">
            Manage goals →
          </Link>
        </div>
      ),
    prayers: (
      <div className="space-y-3">
        <p className="text-sm text-slate-700 dark:text-slate-300">
          {pendingQaza > 0
            ? `${pendingQaza} qaza prayer${pendingQaza === 1 ? "" : "s"} waiting (daily misses + historical debt).`
            : "No pending qaza — keep it up."}
        </p>
        <Link href="/dashboard/religious" className="link inline-flex min-h-[36px] items-center text-sm">
          Open religious →
        </Link>
      </div>
    ),
    spending: (
      <div className="space-y-3">
        <p className="text-sm text-slate-700 dark:text-slate-300">
          You spent <span className="font-semibold tabular-nums">{formatEuro(weekExpensesCents)}</span> this week.
        </p>
        <Link href="/dashboard/budget" className="link inline-flex min-h-[36px] items-center text-sm">
          Open budget →
        </Link>
      </div>
    ),
    people: (
      <div className="space-y-3">
        {overduePeople.length === 0 ? (
          <EmptyState variant="inline" headingLevel="h3" icon="users" title="Everyone is within cadence" />
        ) : (
          <ul className="space-y-1.5 text-sm">
            {overduePeople.map((p) => (
              <li key={p.id} className="flex flex-wrap items-baseline gap-x-2">
                <Link href={`/dashboard/networking/${p.id}`} className="link">
                  {p.name}
                </Link>
                <span className="text-muted">
                  {p.lastTouch ? `last contact ${formatDate(p.lastTouch)}` : "no contact yet"}
                </span>
              </li>
            ))}
          </ul>
        )}
        <Link href="/dashboard/networking" className="link inline-flex min-h-[36px] items-center text-sm">
          Log a call →
        </Link>
      </div>
    ),
    "plan-ahead": (
      <div className="space-y-3">
        <p className="text-sm text-slate-700 dark:text-slate-300">
          {shoppingRemaining > 0
            ? `${shoppingRemaining} shopping item${shoppingRemaining === 1 ? "" : "s"} left for this week's meal plan.`
            : "Meal plan shopping looks complete."}
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href={`/dashboard/plan?day=${toDateInputValue(addDays(now, 1))}`} className="btn-ghost btn-sm min-h-[36px]">
            Plan tomorrow
          </Link>
          <Link href="/dashboard/food/planner" className="btn-ghost btn-sm min-h-[36px]">
            Meal planner
          </Link>
          <Link href="/dashboard/journal" className="btn-ghost btn-sm min-h-[36px]">
            Write journal
          </Link>
        </div>
      </div>
    ),
  };

  return (
    <div>
      <PageHeader title="Weekly review" description={description} />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3">
        <StatCard size="sm" label="Backlog" value={backlog.length} href={`#${stepAnchor("inbox")}`} />
        <StatCard
          size="sm"
          label="Goals done"
          value={`${completedGoals}/${goals.length}`}
          href={`#${stepAnchor("goals")}`}
        />
        <StatCard
          size="sm"
          label="Qaza pending"
          value={pendingQaza}
          href={`#${stepAnchor("prayers")}`}
        />
        <StatCard
          size="sm"
          label="Spent this week"
          value={formatEuro(weekExpensesCents)}
          href={`#${stepAnchor("spending")}`}
        />
        <StatCard
          size="sm"
          label="Overdue people"
          value={overduePeople.length}
          href={`#${stepAnchor("people")}`}
        />
        <StatCard
          size="sm"
          label="Shopping left"
          value={shoppingRemaining}
          href={`#${stepAnchor("plan-ahead")}`}
        />
      </div>

      <section aria-labelledby="review-progress-heading" className="card mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <h2 id="review-progress-heading" className="section-title">
              {isCompleted ? "Review complete" : "Your review"}
            </h2>
            <p className="mt-0.5 text-sm text-muted">
              {isCompleted && review?.completedAt
                ? `Completed ${formatDate(review.completedAt)} · ${progress.done} of ${progress.total} steps`
                : `${progress.done} of ${progress.total} steps`}
            </p>
            <div
              className="progress-track mt-2 h-2 w-full max-w-sm overflow-hidden rounded-full"
              role="progressbar"
              aria-label="Review progress"
              aria-valuemin={0}
              aria-valuemax={progress.total}
              aria-valuenow={progress.done}
              aria-valuetext={`${progress.done} of ${progress.total} steps`}
            >
              <div
                className={clsx("h-full rounded-full transition-all", isCompleted ? "bg-green-500" : "bg-brand-500")}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isCompleted && <span className="badge-success">Done this week</span>}
            <ReviewCompleteButton weekKey={weekKey} completed={isCompleted} remaining={remaining} />
          </div>
        </div>
      </section>

      <ol className="space-y-4">
        {REVIEW_STEPS.map((step, i) => {
          const done = doneSteps.has(step.id);
          return (
            <li key={step.id}>
              <section
                id={stepAnchor(step.id)}
                aria-labelledby={`${stepAnchor(step.id)}-title`}
                className={clsx("card scroll-mt-4", done && "bg-slate-50/60 dark:bg-slate-800/60")}
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span
                      aria-hidden="true"
                      className={clsx(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold tabular-nums",
                        done
                          ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
                          : "bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300"
                      )}
                    >
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <h2 id={`${stepAnchor(step.id)}-title`} className="section-title">
                        <span className="sr-only">Step {i + 1}: </span>
                        {step.title}
                      </h2>
                      <p className="mt-0.5 text-sm text-muted">{step.description}</p>
                    </div>
                  </div>
                  <ReviewStepCheck weekKey={weekKey} step={step.id} title={step.title} done={done} />
                </div>
                <div className="sm:pl-10">{stepBody[step.id]}</div>
              </section>
            </li>
          );
        })}
      </ol>

      <section aria-labelledby="review-notes-heading" className="card mt-6">
        <h2 id="review-notes-heading" className="section-title mb-1">
          Notes
        </h2>
        <p className="mb-3 text-sm text-muted">Anything worth remembering from this week.</p>
        <ReviewNotes weekKey={weekKey} notes={review?.notes ?? ""} />
      </section>

      {!isCompleted && (
        <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
          <p className="text-sm text-muted">
            {progress.done} of {progress.total} steps done
          </p>
          <ReviewCompleteButton weekKey={weekKey} completed={false} remaining={remaining} />
        </div>
      )}
    </div>
  );
}
