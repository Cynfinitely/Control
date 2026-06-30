import Link from "next/link";
import { requireUser } from "@/lib/session";
import { toDateInputValue } from "@/lib/date";
import { getDashboardStats } from "@/lib/queries/dashboard";
import PageHeader from "@/components/PageHeader";
import Icon from "@/components/Icon";

const PRAYERS = 5;

export default async function DashboardHome() {
  const user = await requireUser();
  const now = new Date();
  const todayKey = toDateInputValue(now);

  const stats = await getDashboardStats(user.id, todayKey);

  const cards = [
    {
      label: "Todos today",
      value: `${stats.todayDoneTodos}/${stats.todayOpenTodos + stats.todayDoneTodos}`,
      sub: stats.todayOpenTodos > 0 ? `${stats.todayOpenTodos} left` : "all done",
      href: "/dashboard/todos",
      icon: "check",
    },
    {
      label: "Weekly goals",
      value: stats.weeklyGoals,
      sub: "active this week",
      href: "/dashboard/goals",
      icon: "target",
    },
    {
      label: "Calories today",
      value: Math.round(stats.caloriesToday),
      sub: `of ${Math.round(stats.calorieTarget)} kcal`,
      href: "/dashboard/food",
      icon: "food",
    },
    {
      label: "Workouts today",
      value: stats.workoutsToday,
      sub: stats.workoutsToday > 0 ? "logged" : "none yet",
      href: "/dashboard/exercise",
      icon: "dumbbell",
    },
    {
      label: "Prayers today",
      value: `${stats.prayersOnTime}/${PRAYERS}`,
      sub: stats.pendingQaza > 0 ? `${stats.pendingQaza} qaza pending` : "on time",
      href: "/dashboard/religious",
      icon: "moon",
    },
    {
      label: "Follow-ups",
      value: stats.pendingFollowUps,
      sub: "pending",
      href: "/dashboard/networking",
      icon: "users",
    },
  ];

  const quickLinks = [
    { href: "/dashboard/todos", label: "Add todo", icon: "check" },
    { href: "/dashboard/food", label: "Log meal", icon: "food" },
    { href: "/dashboard/exercise", label: "Log workout", icon: "dumbbell" },
    { href: "/dashboard/religious", label: "Log prayers", icon: "moon" },
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

      <div className="mb-8 flex flex-wrap gap-2">
        {quickLinks.map((q) => (
          <Link key={q.href} href={q.href} className="btn-ghost touch-target">
            <Icon name={q.icon} className="h-4 w-4" />
            {q.label}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((s) => (
          <Link key={s.label} href={s.href} className="card transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500">{s.label}</span>
              <Icon name={s.icon} className="h-5 w-5 text-brand-500" />
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-900">{s.value}</p>
            <p className="mt-1 text-xs text-slate-400">{s.sub}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8">
        <Link href="/dashboard/reports" className="text-sm font-medium text-brand-600 hover:underline">
          View full reports →
        </Link>
      </div>
    </div>
  );
}
