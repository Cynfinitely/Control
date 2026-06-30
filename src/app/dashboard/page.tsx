import Link from "next/link";
import { requireUser } from "@/lib/session";
import { toDateInputValue } from "@/lib/date";
import { getDashboardStats, type DomainHealth } from "@/lib/queries/dashboard";
import PageHeader from "@/components/PageHeader";
import Icon from "@/components/Icon";

const PRAYERS = 5;

const HEALTH_STYLE: Record<DomainHealth, string> = {
  good: "border-l-4 border-l-green-500",
  warn: "border-l-4 border-l-amber-400",
  bad: "border-l-4 border-l-red-500",
};

export default async function DashboardHome() {
  const user = await requireUser();
  const now = new Date();
  const todayKey = toDateInputValue(now);

  const stats = await getDashboardStats(user.id, todayKey);

  const cards = [
    {
      label: "Todos today",
      value: `${stats.todayDoneTodos}/${stats.todayOpenTodos + stats.todayDoneTodos}`,
      sub:
        stats.overdueTodos > 0
          ? `${stats.overdueTodos} overdue`
          : stats.todayOpenTodos > 0
            ? `${stats.todayOpenTodos} left`
            : "all done",
      href: "/dashboard/todos",
      icon: "check",
      health: stats.health.todos,
    },
    {
      label: "Weekly goals",
      value: `${stats.weeklyGoalsCompleted}/${stats.weeklyGoals + stats.weeklyGoalsCompleted}`,
      sub: "completed this week",
      href: "/dashboard/goals",
      icon: "target",
      health: stats.health.goals,
    },
    {
      label: "Calories today",
      value: Math.round(stats.caloriesToday),
      sub: `of ${Math.round(stats.calorieTarget)} kcal · ${stats.waterGlasses} water`,
      href: "/dashboard/food",
      icon: "food",
      health: stats.health.food,
    },
    {
      label: "Workouts",
      value: `${stats.workoutsToday} today`,
      sub: `${stats.workoutsThisWeek} this week`,
      href: "/dashboard/exercise",
      icon: "dumbbell",
      health: stats.health.exercise,
    },
    {
      label: "Prayers today",
      value: `${stats.prayersOnTime}/${PRAYERS}`,
      sub: `${stats.weeklyPrayerRate}% on-time this week${stats.pendingQaza > 0 ? ` · ${stats.pendingQaza} qaza` : ""}`,
      href: "/dashboard/religious",
      icon: "moon",
      health: stats.health.religious,
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
    { href: "/dashboard/todos", label: "Add todo", icon: "check" },
    { href: "/dashboard/food", label: "Log meal", icon: "food" },
    { href: "/dashboard/exercise", label: "Log workout", icon: "dumbbell" },
    { href: "/dashboard/religious", label: "Log prayers", icon: "moon" },
    { href: "/dashboard/review", label: "Weekly review", icon: "chart" },
    { href: "/dashboard/journal", label: "Journal", icon: "book" },
  ];

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user.name ?? "there"}`}
        description={now.toLocaleDateString("en-GB", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      />

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className={`card transition hover:shadow-md ${HEALTH_STYLE[c.health]}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500">{c.label}</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{c.value}</p>
                <p className="mt-0.5 text-xs text-slate-400">{c.sub}</p>
              </div>
              <Icon name={c.icon} className="h-5 w-5 text-brand-500" />
            </div>
          </Link>
        ))}
      </div>

      <h2 className="section-title mb-3">Quick actions</h2>
      <div className="flex flex-wrap gap-2">
        {quickLinks.map((q) => (
          <Link key={q.href} href={q.href} className="btn-ghost touch-target gap-2">
            <Icon name={q.icon} className="h-4 w-4" />
            {q.label}
          </Link>
        ))}
        <Link href="/dashboard/reports" className="btn-ghost touch-target gap-2">
          <Icon name="chart" className="h-4 w-4" />
          View reports
        </Link>
      </div>
    </div>
  );
}
