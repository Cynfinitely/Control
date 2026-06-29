import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { startOfDay, endOfDay } from "@/lib/date";
import { getPeriodKey } from "@/lib/period";
import PageHeader from "@/components/PageHeader";
import Icon from "@/components/Icon";

const PRAYERS = 5;

export default async function DashboardHome() {
  const user = await requireUser();
  const now = new Date();
  const from = startOfDay(now);
  const to = endOfDay(now);
  const userId = user.id;
  const weekKey = getPeriodKey("weekly", now);

  const [
    todayOpenTodos,
    todayDoneTodos,
    weeklyGoals,
    foodToday,
    target,
    workoutsToday,
    prayersToday,
    pendingQaza,
    pendingFollowUps,
  ] = await Promise.all([
    prisma.todo.count({
      where: { userId, status: "open", deletedAt: null, inBacklog: false, dayDate: { gte: from, lte: to } },
    }),
    prisma.todo.count({
      where: { userId, status: "done", deletedAt: null, dayDate: { gte: from, lte: to } },
    }),
    prisma.goal.count({
      where: { userId, status: "active", deletedAt: null, period: "weekly", periodKey: weekKey },
    }),
    prisma.foodLogEntry.findMany({
      where: { userId, deletedAt: null, date: { gte: from, lte: to } },
    }),
    prisma.nutritionTarget.findUnique({ where: { userId } }),
    prisma.workout.count({
      where: { userId, deletedAt: null, date: { gte: from, lte: to } },
    }),
    prisma.prayerLog.findMany({
      where: { userId, date: { gte: from, lte: to } },
    }),
    prisma.qazaPrayer.count({ where: { userId, fulfilledAt: null } }),
    prisma.followUp.count({ where: { userId, done: false } }),
  ]);

  const caloriesToday = foodToday.reduce((s, f) => s + f.calories, 0);
  const calorieTarget = target?.calories ?? 2000;
  const prayersOnTime = prayersToday.filter((p) => p.status === "ontime").length;

  const stats = [
    {
      label: "Todos today",
      value: `${todayDoneTodos}/${todayOpenTodos + todayDoneTodos}`,
      sub: todayOpenTodos > 0 ? `${todayOpenTodos} left` : "all done",
      href: "/dashboard/todos",
      icon: "check",
    },
    {
      label: "Weekly goals",
      value: weeklyGoals,
      sub: "active this week",
      href: "/dashboard/goals",
      icon: "target",
    },
    {
      label: "Calories today",
      value: Math.round(caloriesToday),
      sub: `of ${Math.round(calorieTarget)} kcal`,
      href: "/dashboard/food",
      icon: "food",
    },
    {
      label: "Workouts today",
      value: workoutsToday,
      sub: workoutsToday > 0 ? "logged" : "none yet",
      href: "/dashboard/exercise",
      icon: "dumbbell",
    },
    {
      label: "Prayers today",
      value: `${prayersOnTime}/${PRAYERS}`,
      sub: pendingQaza > 0 ? `${pendingQaza} qaza pending` : "on time",
      href: "/dashboard/religious",
      icon: "moon",
    },
    {
      label: "Follow-ups",
      value: pendingFollowUps,
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
        {stats.map((s) => (
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
