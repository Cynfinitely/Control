import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { addDays, toDateInputValue } from "@/lib/date";
import { getPeriodKey } from "@/lib/period";
import { formatLongDateInZone, greetingForHour, hourInZone, isoWeekdayInZone, shouldNudgeWeeklyReview } from "@/lib/greeting";
import { getDashboardStats, type DomainHealth } from "@/lib/queries/dashboard";
import { getPlanPreviewBlocks, getPlanDayStats } from "@/lib/queries/plan";
import { getInspirations } from "@/lib/queries/inspirations";
import { getPrincipleReviewedToday } from "@/lib/queries/principles";
import { getLifePriorities } from "@/lib/queries/priorities";
import { getDayTodos } from "@/lib/queries/todos";
import { getUserWeather } from "@/lib/queries/weather";
import { getDisabledModules } from "@/lib/queries/modules";
import { moduleFilter, type ModuleId } from "@/lib/modules";
import { formatEuroSigned } from "@/lib/budget";
import PageHeader from "@/components/PageHeader";
import Icon from "@/components/Icon";
import StatCard, { type StatTone } from "@/components/StatCard";
import OnboardingChecklist from "@/components/OnboardingChecklist";
import InspirationSpotlight from "@/components/InspirationSpotlight";
import PrincipleReviewCard from "@/components/PrincipleReviewCard";
import LifePrioritiesCard from "@/components/LifePrioritiesCard";
import HomeTodosCard from "@/components/HomeTodosCard";
import HomeWeatherCard from "@/components/HomeWeatherCard";
import PlanPreview from "./plan/PlanPreview";
import HomeQuickActions from "./HomeQuickActions";

export const metadata = { title: "Today" };

const PRAYERS = 5;

const HEALTH: Record<DomainHealth, { tone: StatTone; status: string }> = {
  good: { tone: "good", status: "On track" },
  warn: { tone: "warn", status: "Needs attention" },
  bad: { tone: "bad", status: "Off track" },
};

/** The review nudge is optional: never let its query take the home page down. */
async function getRecentWeeklyReviews(userId: string, weekKeys: string[]) {
  try {
    return await prisma.weeklyReview.findMany({
      where: { userId, weekKey: { in: weekKeys } },
      select: { weekKey: true, completedAt: true, completedSteps: true },
    });
  } catch (err) {
    console.error("Weekly review nudge query failed", err);
    return [];
  }
}

export default async function DashboardHome() {
  const sessionUser = await requireUser();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: sessionUser.id },
    select: { name: true, timezone: true, createdAt: true },
  });
  const now = new Date();
  const todayKey = toDateInputValue(now);
  const thisWeekKey = getPeriodKey("weekly", now);
  const lastWeekKey = getPeriodKey("weekly", addDays(now, -7));

  // Modules the user switched off are neither queried nor shown.
  const disabledModules = await getDisabledModules(sessionUser.id);
  const modules = moduleFilter(disabledModules);

  const stats = await getDashboardStats(sessionUser.id, todayKey);
  const [planPreview, planStats, inspirations, principlesReviewed, priorities, todayTodos, reviews, weather] = await Promise.all([
    modules.has("plan") ? getPlanPreviewBlocks(sessionUser.id, todayKey) : null,
    modules.has("plan") ? getPlanDayStats(sessionUser.id, todayKey, now) : null,
    modules.has("inspirations") ? getInspirations(sessionUser.id) : null,
    modules.has("principles") ? getPrincipleReviewedToday(sessionUser.id, now) : null,
    modules.has("priorities") ? getLifePriorities(sessionUser.id) : null,
    modules.has("todos") ? getDayTodos(sessionUser.id, todayKey) : null,
    modules.has("review") ? getRecentWeeklyReviews(sessionUser.id, [thisWeekKey, lastWeekKey]) : [],
    modules.has("weather") ? getUserWeather(sessionUser.id) : null,
  ]);

  const thisWeekReview = reviews.find((r) => r.weekKey === thisWeekKey);
  const lastWeekReview = reviews.find((r) => r.weekKey === lastWeekKey);
  const showReviewNudge = modules.has("review") && shouldNudgeWeeklyReview({
    isoWeekday: isoWeekdayInZone(now, user.timezone),
    thisWeekCompleted: Boolean(thisWeekReview?.completedAt),
    lastWeekStartedNotCompleted: Boolean(lastWeekReview && !lastWeekReview.completedAt),
  });
  const reviewStarted = Boolean(thisWeekReview?.completedSteps || thisWeekReview?.completedAt);

  const goalTotal = stats.weeklyGoals + stats.weeklyGoalsCompleted;

  const [hasMeal, hasWeeklyGoal, hasPrayerDebt] = await Promise.all([
    prisma.foodLogEntry.count({ where: { userId: sessionUser.id, deletedAt: null } }).then((n) => n > 0),
    prisma.goal.count({ where: { userId: sessionUser.id, deletedAt: null, period: "weekly" } }).then((n) => n > 0),
    prisma.prayerDebt.count({ where: { userId: sessionUser.id } }).then((n) => n > 0),
  ]);

  const cards = modules.keep<{
    module: ModuleId;
    label: string;
    value: string | number;
    sub: string;
    href: string;
    icon: string;
    health: DomainHealth;
    progress?: number;
  }>([
    {
      module: "goals",
      label: "Weekly goals",
      value: `${stats.weeklyGoalsCompleted}/${goalTotal || 0}`,
      sub: "completed this week",
      href: "/dashboard/goals",
      icon: "target",
      health: stats.health.goals,
      progress: goalTotal > 0 ? (stats.weeklyGoalsCompleted / goalTotal) * 100 : 0,
    },
    {
      module: "food",
      label: "Food logged",
      value: `${stats.mealsToday} today`,
      sub: `${stats.foodDaysThisWeek}/7 days this week · ${stats.waterGlasses} water`,
      href: "/dashboard/food",
      icon: "food",
      health: stats.health.food,
      progress: (stats.foodDaysThisWeek / 7) * 100,
    },
    {
      module: "budget",
      label: "Budget",
      value: stats.budgetSetupComplete
        ? formatEuroSigned(stats.budgetMonthNetCents)
        : "Import",
      sub: stats.budgetSetupComplete
        ? stats.budgetUncategorizedCount > 0
          ? `${stats.budgetUncategorizedCount} uncategorized`
          : "this month net"
        : "Upload Nordea CSV",
      href: "/dashboard/budget",
      icon: "wallet",
      health: stats.health.budget,
    },
    {
      module: "exercise",
      label: "Workouts",
      value: `${stats.workoutsToday} today`,
      sub: `${stats.workoutsThisWeek} this week`,
      href: "/dashboard/exercise",
      icon: "dumbbell",
      health: stats.health.exercise,
      progress: Math.min(100, (stats.workoutsThisWeek / 3) * 100),
    },
    {
      module: "religious",
      label: "Prayers today",
      value: `${stats.prayersOnTime}/${PRAYERS}`,
      sub: [
        stats.prayersMissed > 0 ? `${stats.prayersMissed} missed` : null,
        stats.prayersUnlogged > 0 ? `${stats.prayersUnlogged} not logged` : null,
        stats.prayersMissed === 0 && stats.prayersUnlogged === 0
          ? `${stats.weeklyPrayerRate}% on-time this week`
          : null,
        stats.pendingQaza > 0 ? `${stats.pendingQaza} qaza` : null,
      ]
        .filter(Boolean)
        .join(" · ") || "not logged yet",
      href: "/dashboard/religious",
      icon: "moon",
      health: stats.health.religious,
      progress: (stats.prayersOnTime / PRAYERS) * 100,
    },
    {
      module: "career",
      label: "Career",
      value: stats.careerGoalsActive,
      sub: `${Math.round(stats.learningHoursWeek)}h learning this week${stats.expiringCerts > 0 ? ` · ${stats.expiringCerts} cert expiring` : ""}`,
      href: "/dashboard/career",
      icon: "briefcase",
      health: stats.health.career,
    },
    {
      module: "networking",
      label: "Networking",
      value: stats.overdueContacts,
      sub: stats.overdueContacts === 0 ? "all caught up" : "overdue",
      href: "/dashboard/networking?tab=insights",
      icon: "users",
      health: stats.health.networking,
    },
  ]);

  const showMainColumn = Boolean(todayTodos || (planPreview && planStats));
  const showGlance = Boolean(weather) || cards.length > 0;

  const displayName = user.name ?? "there";

  return (
    <div>
      <PageHeader help="home"
        title={greetingForHour(hourInZone(now, user.timezone), displayName)}
        description={formatLongDateInZone(now, user.timezone)}
      />

      {showReviewNudge && (
        <section
          className="card mb-6 flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
          aria-labelledby="review-nudge-title"
        >
          <div className="flex min-w-0 items-start gap-3">
            <Icon name="clipboard" className="mt-0.5 h-5 w-5 shrink-0 text-brand-600 dark:text-brand-400" />
            <div className="min-w-0">
              <h2 id="review-nudge-title" className="subsection-title">
                Weekly review — not done yet this week
              </h2>
              <p className="mt-0.5 text-sm text-muted">
                {lastWeekReview && !lastWeekReview.completedAt && !reviewStarted
                  ? "Last week's review was left unfinished. A few minutes now sets up the week."
                  : "A few minutes to look back, tidy up and plan the week ahead."}
              </p>
            </div>
          </div>
          <Link href="/dashboard/review" className="btn-ghost btn-sm min-h-[40px] shrink-0 self-start sm:self-center">
            {reviewStarted ? "Continue review" : "Start review"}
            <Icon name="arrowRight" className="h-3.5 w-3.5" />
          </Link>
        </section>
      )}

      <OnboardingChecklist
        userId={sessionUser.id}
        userCreatedAt={user.createdAt.toISOString()}
        items={modules.keep<{ module: ModuleId; id: string; label: string; href: string; done: boolean }>([
          {
            module: "food",
            id: "meal",
            label: "Log your first meal",
            href: "/dashboard/food?focus=log",
            done: hasMeal,
          },
          {
            module: "goals",
            id: "goal",
            label: "Create a weekly goal",
            href: "/dashboard/goals?focus=add",
            done: hasWeeklyGoal,
          },
          {
            module: "budget",
            id: "budget",
            label: "Import your budget transactions",
            href: "/dashboard/budget",
            done: stats.budgetSetupComplete,
          },
          {
            module: "religious",
            id: "prayer",
            label: "Configure prayer debt (if needed)",
            href: "/dashboard/religious",
            done: hasPrayerDebt || stats.prayersOnTime > 0,
          },
        ])}
      />

      {priorities && <LifePrioritiesCard items={priorities} />}

      {(showMainColumn || showGlance) && (
      <div className={showMainColumn && showGlance ? "mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3" : "mb-6"}>
        {showMainColumn && (
        <div className="min-w-0 lg:col-span-2">
          {todayTodos && <HomeTodosCard todos={todayTodos} dayValue={todayKey} overdueCount={stats.overdueTodos} />}
          {planPreview && planStats && (
          <PlanPreview
            blocks={planPreview.blocks}
            stats={planStats}
            currentBlockId={planPreview.currentBlockId}
            isToday
          />
          )}
        </div>
        )}
        {showGlance && (
        <aside aria-labelledby="glance-title" className="min-w-0">
          <h2 id="glance-title" className="section-title mb-3">
            Today at a glance
          </h2>
          {weather && <HomeWeatherCard weather={weather} />}
          <div className={showMainColumn ? "grid grid-cols-2 gap-2 lg:grid-cols-1" : "grid grid-cols-2 gap-2 lg:grid-cols-4"}>
            {cards.map((c) => (
              <StatCard
                key={c.label}
                label={c.label}
                value={c.value}
                hint={c.sub}
                href={c.href}
                icon={c.icon}
                tone={HEALTH[c.health].tone}
                status={HEALTH[c.health].status}
                progress={c.progress}
                size="sm"
              />
            ))}
          </div>
        </aside>
        )}
      </div>
      )}

      {(inspirations || principlesReviewed !== null) && (
      <div className="mb-6 grid grid-cols-1 gap-3 lg:grid-cols-2">
        {inspirations && <InspirationSpotlight items={inspirations} />}
        {principlesReviewed !== null && <PrincipleReviewCard reviewedToday={principlesReviewed} />}
      </div>
      )}

      <HomeQuickActions disabledModules={disabledModules} />
    </div>
  );
}
