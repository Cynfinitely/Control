import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { getPeriodKey } from "@/lib/period";
import { startOfWeek, addDays, toDateInputValue, formatDate, endOfDay } from "@/lib/date";
import { historicalDebtRemaining } from "@/lib/prayer-debt";
import { getBacklogTodos } from "@/lib/queries/todos";
import { getGoalsForPeriod } from "@/lib/queries/goals";
import { getWeekExpenseTotal } from "@/lib/queries/budget";
import { formatEuro } from "@/lib/budget";
import PageHeader from "@/components/PageHeader";
import SubmitButton from "@/components/SubmitButton";
import FormAction from "@/components/FormAction";
import { moveUnfinishedToBacklogForm } from "../todos/actions";

export default async function WeeklyReviewPage() {
  const user = await requireUser();
  const now = new Date();
  const weekKey = getPeriodKey("weekly", now);
  const weekStart = startOfWeek(now);
  const weekEnd = endOfDay(addDays(weekStart, 6));
  const yesterday = addDays(now, -1);

  const [backlog, goals, pendingQazaDaily, prayerDebts, pendingFollowUps, shoppingRemaining, incompleteGoals, weekExpensesCents] =
    await Promise.all([
      getBacklogTodos(user.id),
      getGoalsForPeriod(user.id, "weekly", weekKey),
      prisma.qazaPrayer.count({ where: { userId: user.id, fulfilledAt: null } }),
      prisma.prayerDebt.findMany({ where: { userId: user.id } }),
      prisma.followUp.findMany({
        where: { userId: user.id, done: false },
        include: { contact: true },
        orderBy: { dueDate: "asc" },
        take: 10,
      }),
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
      prisma.goal.count({
        where: {
          userId: user.id,
          deletedAt: null,
          period: "weekly",
          periodKey: weekKey,
          status: "active",
        },
      }),
      getWeekExpenseTotal(user.id, weekStart, weekEnd),
    ]);

  const pendingQaza = pendingQazaDaily + historicalDebtRemaining(prayerDebts);

  const completedGoals = goals.filter((g) => g.status === "completed").length;

  return (
    <div>
      <PageHeader
        title="Weekly review"
        description={`Week of ${formatDate(weekStart)} — your command center for the week ahead.`}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="card">
          <p className="text-sm text-slate-500">Backlog</p>
          <p className="text-2xl font-bold">{backlog.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500">Goals done</p>
          <p className="text-2xl font-bold">
            {completedGoals}/{goals.length}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500">Spent this week</p>
          <p className="text-2xl font-bold">{formatEuro(weekExpensesCents)}</p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500">Qaza pending</p>
          <p className="text-2xl font-bold">{pendingQaza}</p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500">Follow-ups</p>
          <p className="text-2xl font-bold">{pendingFollowUps.length}</p>
        </div>
      </div>

      <section className="card mb-6">
        <h2 className="section-title mb-2">1. Clear yesterday</h2>
        <p className="mb-3 text-sm text-slate-500">
          Move unfinished todos from yesterday into backlog so today starts clean.
        </p>
        <FormAction action={moveUnfinishedToBacklogForm} successMessage="Moved to backlog">
          <input type="hidden" name="dayDate" value={toDateInputValue(yesterday)} />
          <SubmitButton className="btn-ghost">Move yesterday&apos;s open todos to backlog</SubmitButton>
        </FormAction>
      </section>

      <section className="card mb-6">
        <h2 className="section-title mb-2">2. Review backlog ({backlog.length})</h2>
        {backlog.length === 0 ? (
          <p className="text-sm text-slate-400">Backlog is empty — nice work.</p>
        ) : (
          <ul className="space-y-1 text-sm text-slate-600">
            {backlog.slice(0, 8).map((t) => (
              <li key={t.id}>· {t.title}</li>
            ))}
            {backlog.length > 8 && <li className="text-slate-400">…and {backlog.length - 8} more</li>}
          </ul>
        )}
        <Link href="/dashboard/todos" className="btn-ghost mt-3 inline-block text-sm">
          Open todos →
        </Link>
      </section>

      <section className="card mb-6">
        <h2 className="section-title mb-2">3. Weekly goals ({incompleteGoals} active)</h2>
        <p className="text-sm text-slate-500">
          {completedGoals} completed · {incompleteGoals} still active this week.
        </p>
        <Link href="/dashboard/goals" className="btn-ghost mt-3 inline-block text-sm">
          Review goals →
        </Link>
      </section>

      <section className="card mb-6">
        <h2 className="section-title mb-2">4. Spiritual catch-up</h2>
        <p className="text-sm text-slate-500">
          {pendingQaza > 0
            ? `${pendingQaza} qaza prayers waiting (daily misses + historical debt) — work through them on the religious page.`
            : "No pending qaza — keep it up."}
        </p>
        <Link href="/dashboard/religious" className="btn-ghost mt-3 inline-block text-sm">
          Open religious →
        </Link>
      </section>

      <section className="card mb-6">
        <h2 className="section-title mb-2">5. Relationships</h2>
        <p className="mb-2 text-sm text-slate-500">
          Stay in touch with family, friends, and professional contacts — log calls and follow-ups.
        </p>
        {pendingFollowUps.length === 0 ? (
          <p className="text-sm text-slate-400">No pending follow-ups.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {pendingFollowUps.map((f) => (
              <li key={f.id}>
                · {f.note}{" "}
                <Link href={`/dashboard/networking/${f.contactId}`} className="text-brand-600">
                  {f.contact.name}
                </Link>
                {f.dueDate && <span className="text-slate-400"> · {formatDate(f.dueDate)}</span>}
              </li>
            ))}
          </ul>
        )}
        <Link href="/dashboard/networking" className="btn-ghost mt-3 inline-block text-sm">
          Open networking →
        </Link>
      </section>

      <section className="card mb-6">
        <h2 className="section-title mb-2">6. Plan next week</h2>
        <p className="mb-3 text-sm text-slate-500">
          Schedule tomorrow and the week ahead with time blocks — todos, meals, prayers, and follow-ups.
        </p>
        <Link
          href={`/dashboard/plan?day=${toDateInputValue(addDays(now, 1))}`}
          className="btn-ghost inline-block text-sm"
        >
          Plan tomorrow →
        </Link>
        <p className="mt-3 text-sm text-slate-500">
          {shoppingRemaining > 0
            ? `${shoppingRemaining} shopping items left for this week&apos;s meal plan.`
            : "Meal plan shopping looks complete."}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/dashboard/food/planner" className="btn-ghost text-sm">
            Meal planner →
          </Link>
          <Link href="/dashboard/journal" className="btn-ghost text-sm">
            Write journal →
          </Link>
        </div>
      </section>
    </div>
  );
}
