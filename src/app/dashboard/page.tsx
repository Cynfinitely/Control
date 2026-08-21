import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { toDateInputValue } from "@/lib/date";
import { getDashboardStats, type DomainHealth } from "@/lib/queries/dashboard";
import { getPlanPreviewBlocks, getPlanDayStats } from "@/lib/queries/plan";
import { getInspirations } from "@/lib/queries/inspirations";
import { getPrincipleReviewedToday } from "@/lib/queries/principles";
import { getLifePriorities } from "@/lib/queries/priorities";
import { formatEuroSigned } from "@/lib/budget";
import PageHeader from "@/components/PageHeader";
import Icon from "@/components/Icon";
import DashboardStatCard, { greetingForHour } from "@/components/DashboardStatCard";
import OnboardingChecklist from "@/components/OnboardingChecklist";
import InspirationSpotlight from "@/components/InspirationSpotlight";
import PrincipleReviewCard from "@/components/PrincipleReviewCard";
import LifePrioritiesCard from "@/components/LifePrioritiesCard";
import PlanPreview from "./plan/PlanPreview";

const PRAYERS = 5;

const HEALTH_STYLE: Record<DomainHealth, string> = {
  good: "border-l-4 border-l-green-500",
  warn: "border-l-4 border-l-amber-400",
  bad: "border-l-4 border-l-red-500",
};

export default async function DashboardHome() {
  const sessionUser = await requireUser();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: sessionUser.id },
    select: { name: true, timezone: true, createdAt: true },
  });
  const now = new Date();
  const todayKey = toDateInputValue(now);

  const stats = await getDashboardStats(sessionUser.id, todayKey);
  const [planPreview, planStats, inspirations, principlesReviewed, priorities] = await Promise.all([
    getPlanPreviewBlocks(sessionUser.id, todayKey),
    getPlanDayStats(sessionUser.id, todayKey, now),
    getInspirations(sessionUser.id),
    getPrincipleReviewedToday(sessionUser.id, now),
    getLifePriorities(sessionUser.id),
  ]);

  const todoTotal = stats.todayOpenTodos + stats.todayDoneTodos;
  const goalTotal = stats.weeklyGoals + stats.weeklyGoalsCompleted;

  const [hasMeal, hasWeeklyGoal, hasPrayerDebt] = await Promise.all([
    prisma.foodLogEntry.count({ where: { userId: sessionUser.id, deletedAt: null } }).then((n) => n > 0),
    prisma.goal.count({ where: { userId: sessionUser.id, deletedAt: null, period: "weekly" } }).then((n) => n > 0),
    prisma.prayerDebt.count({ where: { userId: sessionUser.id } }).then((n) => n > 0),
  ]);

  const cards = [
    {
      label: "Todos today",
      value: `${stats.todayOpenTodos}`,
      sub:
        stats.overdueTodos > 0
          ? `${stats.overdueTodos} overdue · ${stats.todayDoneTodos}/${todoTotal || 0} done`
          : todoTotal > 0
            ? `${stats.todayDoneTodos}/${todoTotal} done`
            : "no todos yet",
      href: "/dashboard/todos",
      icon: "check",
      health: stats.health.todos,
      progress: todoTotal > 0 ? (stats.todayDoneTodos / todoTotal) * 100 : 0,
    },
    {
      label: "Weekly goals",
      value: `${stats.weeklyGoalsCompleted}/${goalTotal || 0}`,
      sub: "completed this week",
      href: "/dashboard/goals",
      icon: "target",
      health: stats.health.goals,
      progress: goalTotal > 0 ? (stats.weeklyGoalsCompleted / goalTotal) * 100 : 0,
    },
    {
      label: "Calories today",
      value: Math.round(stats.caloriesToday),
      sub: `of ${Math.round(stats.calorieTarget)} kcal · ${stats.waterGlasses} water`,
      href: "/dashboard/food",
      icon: "food",
      health: stats.health.food,
      progress: stats.calorieTarget > 0 ? (stats.caloriesToday / stats.calorieTarget) * 100 : 0,
    },
    {
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
      label: "Workouts",
      value: `${stats.workoutsToday} today`,
      sub: `${stats.workoutsThisWeek} this week`,
      href: "/dashboard/exercise",
      icon: "dumbbell",
      health: stats.health.exercise,
      progress: Math.min(100, (stats.workoutsThisWeek / 3) * 100),
    },
    {
      label: "Prayers today",
      value: `${stats.prayersOnTime}/${PRAYERS}`,
      sub: `${stats.weeklyPrayerRate}% on-time this week${stats.pendingQaza > 0 ? ` · ${stats.pendingQaza} qaza` : ""}`,
      href: "/dashboard/religious",
      icon: "moon",
      health: stats.health.religious,
      progress: (stats.prayersOnTime / PRAYERS) * 100,
    },
    {
      label: "Career",
      value: stats.careerGoalsActive,
      sub: `${Math.round(stats.learningHoursWeek)}h learning this week${stats.expiringCerts > 0 ? ` · ${stats.expiringCerts} cert expiring` : ""}`,
      href: "/dashboard/career",
      icon: "briefcase",
      health: stats.health.career,
    },
    {
      label: "Follow-ups",
      value: stats.pendingFollowUps,
      sub: "pending",
      href: "/dashboard/networking",
      icon: "users",
      health: stats.health.networking,
    },
  ];

  const quickLinks = [
    { href: "/dashboard/plan?focus=add", label: "Daily plan", icon: "calendar" },
    { href: "/dashboard/todos?focus=add", label: "Add todo", icon: "check" },
    { href: "/dashboard/work?focus=add", label: "Work focus", icon: "briefcase" },
    { href: "/dashboard/food?focus=log", label: "Log meal", icon: "food" },
    { href: "/dashboard/budget", label: "Import budget", icon: "wallet" },
    { href: "/dashboard/exercise?focus=log", label: "Log workout", icon: "dumbbell" },
    { href: "/dashboard/religious", label: "Log prayers", icon: "moon" },
    { href: "/dashboard/review", label: "Weekly review", icon: "clipboard" },
    { href: "/dashboard/journal?focus=add", label: "Journal", icon: "book" },
  ];

  const displayName = user.name ?? "there";

  return (
    <div>
      <PageHeader
        title={greetingForHour(now.getHours(), displayName)}
        description={now.toLocaleDateString("en-GB", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      />

      <OnboardingChecklist
        userCreatedAt={user.createdAt.toISOString()}
        items={[
          {
            id: "timezone",
            label: "Review your timezone in Settings",
            href: "/dashboard/settings",
            done: Boolean(user.timezone),
          },
          {
            id: "meal",
            label: "Log your first meal",
            href: "/dashboard/food?focus=log",
            done: hasMeal,
          },
          {
            id: "goal",
            label: "Create a weekly goal",
            href: "/dashboard/goals?focus=add",
            done: hasWeeklyGoal,
          },
          {
            id: "budget",
            label: "Import your budget transactions",
            href: "/dashboard/budget",
            done: stats.budgetSetupComplete,
          },
          {
            id: "prayer",
            label: "Configure prayer debt (if needed)",
            href: "/dashboard/religious",
            done: hasPrayerDebt || stats.prayersOnTime > 0,
          },
        ]}
      />

      <LifePrioritiesCard items={priorities} />

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PlanPreview
            blocks={planPreview.blocks}
            stats={planStats}
            currentBlockId={planPreview.currentBlockId}
            dayValue={todayKey}
            isToday
            todoOpen={stats.todayOpenTodos}
            todoDone={stats.todayDoneTodos}
          />
        </div>
        <aside>
          <h2 className="section-title mb-3">Today at a glance</h2>
          <div className="grid grid-cols-2 gap-2">
            {cards.map((c) => (
              <DashboardStatCard
                key={c.label}
                label={c.label}
                value={c.value}
                sub={c.sub}
                href={c.href}
                icon={c.icon}
                healthClass={HEALTH_STYLE[c.health]}
                progress={c.progress}
                compact
              />
            ))}
          </div>
        </aside>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <InspirationSpotlight items={inspirations} compact />
        <PrincipleReviewCard reviewedToday={principlesReviewed} compact />
      </div>

      <h2 className="section-title mb-3">Quick actions</h2>
      <div className="flex flex-wrap gap-2">
        {quickLinks.map((q) => (
          <Link key={q.href} href={q.href} className="btn-ghost touch-target gap-2 text-sm">
            <Icon name={q.icon} className="h-4 w-4" />
            {q.label}
          </Link>
        ))}
        <Link href="/dashboard/reports" className="btn-ghost touch-target gap-2 text-sm">
          <Icon name="chart" className="h-4 w-4" />
          View reports
        </Link>
      </div>
    </div>
  );
}
