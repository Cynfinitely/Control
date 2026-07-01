import { prisma } from "@/lib/db";
import { rangeFor } from "@/lib/date";
import { getPeriodKey } from "@/lib/period";
import { historicalDebtRemaining } from "@/lib/prayer-debt";

export type Period = "daily" | "weekly" | "monthly";

export type ReportStat = {
  label: string;
  value: string | number;
  href?: string;
};

export async function buildReport(userId: string, period: Period) {
  const { from, to } = rangeFor(period);
  const weekKey = getPeriodKey("weekly", from);

  const [
    todosCompleted,
    todosCreated,
    backlogCount,
    overdueTodos,
    activeGoalsInPeriod,
    completedGoals,
    foodEntries,
    target,
    workouts,
    weights,
    prayers,
    qazaFulfilled,
    qazaPendingDaily,
    prayerDebts,
    dhikr,
    quran,
    fasts,
    learning,
    careerGoalsCompleted,
    skillsCount,
    interactions,
    followUpsDone,
    waterGlasses,
  ] = await Promise.all([
    prisma.todo.count({ where: { userId, completedAt: { gte: from, lte: to } } }),
    prisma.todo.count({ where: { userId, createdAt: { gte: from, lte: to }, deletedAt: null } }),
    prisma.todo.count({ where: { userId, inBacklog: true, status: "open", deletedAt: null } }),
    prisma.todo.count({
      where: { userId, deletedAt: null, status: "open", dueDate: { lt: new Date() } },
    }),
    prisma.goal.count({
      where: { userId, status: "active", deletedAt: null, period: "weekly", periodKey: weekKey },
    }),
    prisma.goal.count({
      where: { userId, status: "completed", updatedAt: { gte: from, lte: to } },
    }),
    prisma.foodLogEntry.findMany({ where: { userId, deletedAt: null, date: { gte: from, lte: to } } }),
    prisma.nutritionTarget.findUnique({ where: { userId } }),
    prisma.workout.findMany({
      where: { userId, deletedAt: null, date: { gte: from, lte: to } },
      include: { exercises: { include: { sets: true } } },
    }),
    prisma.bodyWeightLog.findMany({ where: { userId, date: { gte: from, lte: to } }, orderBy: { date: "asc" } }),
    prisma.prayerLog.findMany({ where: { userId, date: { gte: from, lte: to } } }),
    prisma.qazaPrayer.count({
      where: { userId, fulfilledAt: { gte: from, lte: to } },
    }),
    prisma.qazaPrayer.count({ where: { userId, fulfilledAt: null } }),
    prisma.prayerDebt.findMany({ where: { userId } }),
    prisma.dhikrLog.findMany({ where: { userId, date: { gte: from, lte: to } } }),
    prisma.quranProgress.findMany({ where: { userId, date: { gte: from, lte: to } } }),
    prisma.fastingLog.count({ where: { userId, date: { gte: from, lte: to } } }),
    prisma.learningEntry.findMany({ where: { userId, deletedAt: null, date: { gte: from, lte: to } } }),
    prisma.careerGoal.count({
      where: { userId, status: "completed", deletedAt: null, updatedAt: { gte: from, lte: to } },
    }),
    prisma.skill.count({ where: { userId, deletedAt: null, createdAt: { gte: from, lte: to } } }),
    prisma.interaction.count({ where: { userId, date: { gte: from, lte: to } } }),
    prisma.followUp.count({
      where: { userId, done: true, dueDate: { gte: from, lte: to } },
    }),
    prisma.waterLog.aggregate({
      where: { userId, date: { gte: from, lte: to } },
      _sum: { glasses: true },
    }),
  ]);

  const days = Math.max(1, Math.round((to.getTime() - from.getTime()) / 86400000));
  const totalCalories = foodEntries.reduce((s, f) => s + f.calories, 0);
  const totalProtein = foodEntries.reduce((s, f) => s + f.protein, 0);
  const avgCalories = foodEntries.length ? totalCalories / days : 0;
  const avgProtein = foodEntries.length ? totalProtein / days : 0;
  const calorieTarget = target?.calories ?? 2000;

  const qazaPending = qazaPendingDaily + historicalDebtRemaining(prayerDebts);

  const gymWorkouts = workouts.filter((w) => w.activityType === "gym");
  const walkWorkouts = workouts.filter((w) => w.activityType === "walk");
  const cardioWorkouts = workouts.filter((w) => w.activityType !== "gym");
  const totalSets = gymWorkouts.reduce(
    (s, w) => s + w.exercises.reduce((a, e) => a + e.sets.length, 0),
    0
  );
  const totalCardioMin = cardioWorkouts.reduce((s, w) => s + (w.durationMin ?? 0), 0);

  const prayersOnTime = prayers.filter((p) => p.status === "ontime").length;
  const prayersMissed = prayers.filter((p) => p.status === "missed").length;
  const prayersLogged = prayers.length;
  const prayerOnTimeRate = prayersLogged ? Math.round((prayersOnTime / prayersLogged) * 100) : 0;
  const dhikrTotal = dhikr.reduce((s, d) => s + d.count, 0);
  const quranPages = quran.reduce((s, q) => s + q.pagesRead, 0);
  const learningHours = learning.reduce((s, l) => s + l.hours, 0);

  const weightDelta =
    weights.length >= 2 ? weights[weights.length - 1].weightKg - weights[0].weightKg : null;

  return {
    period,
    from,
    to,
    sections: [
      {
        title: "Productivity",
        stats: [
          { label: "Todos completed", value: todosCompleted, href: "/dashboard/todos" },
          { label: "Todos created", value: todosCreated, href: "/dashboard/todos" },
          { label: "In backlog", value: backlogCount, href: "/dashboard/todos" },
          { label: "Overdue", value: overdueTodos, href: "/dashboard/todos" },
        ],
      },
      {
        title: "Goals",
        stats: [
          { label: "Active (this week)", value: activeGoalsInPeriod, href: "/dashboard/goals" },
          { label: "Completed this period", value: completedGoals, href: "/dashboard/goals" },
        ],
      },
      {
        title: "Nutrition",
        stats: [
          { label: "Avg calories/day", value: Math.round(avgCalories), href: "/dashboard/food" },
          { label: "Avg protein/day", value: `${Math.round(avgProtein)}g`, href: "/dashboard/food" },
          { label: "Daily target", value: Math.round(calorieTarget), href: "/dashboard/food" },
          { label: "Food entries", value: foodEntries.length, href: "/dashboard/food" },
          { label: "Water (glasses)", value: waterGlasses._sum.glasses ?? 0, href: "/dashboard/food" },
        ],
      },
      {
        title: "Fitness",
        stats: [
          { label: "Workouts", value: workouts.length, href: "/dashboard/exercise" },
          { label: "Gym sessions", value: gymWorkouts.length, href: "/dashboard/exercise" },
          { label: "Walks", value: walkWorkouts.length, href: "/dashboard/exercise" },
          { label: "Cardio (min)", value: totalCardioMin, href: "/dashboard/exercise" },
          { label: "Gym sets", value: totalSets, href: "/dashboard/exercise" },
          {
            label: "Weight change",
            value: weightDelta === null ? "-" : `${weightDelta > 0 ? "+" : ""}${weightDelta.toFixed(1)} kg`,
            href: "/dashboard/exercise",
          },
        ],
      },
      {
        title: "Religious",
        stats: [
          { label: "Prayers on time", value: prayersOnTime, href: "/dashboard/religious" },
          { label: "Prayers missed", value: prayersMissed, href: "/dashboard/religious" },
          { label: "On-time rate", value: `${prayerOnTimeRate}%`, href: "/dashboard/religious" },
          { label: "Qaza fulfilled", value: qazaFulfilled, href: "/dashboard/religious" },
          { label: "Qaza pending", value: qazaPending, href: "/dashboard/religious" },
          { label: "Dhikr total", value: dhikrTotal, href: "/dashboard/religious" },
          { label: "Quran pages", value: quranPages, href: "/dashboard/religious" },
          { label: "Fasting days", value: fasts, href: "/dashboard/religious" },
        ],
      },
      {
        title: "Career",
        stats: [
          { label: "Learning entries", value: learning.length, href: "/dashboard/career" },
          { label: "Learning hours", value: Math.round(learningHours), href: "/dashboard/career" },
          { label: "Goals completed", value: careerGoalsCompleted, href: "/dashboard/career" },
          { label: "Skills added", value: skillsCount, href: "/dashboard/career" },
        ],
      },
      {
        title: "Networking",
        stats: [
          { label: "Interactions", value: interactions, href: "/dashboard/networking" },
          { label: "Follow-ups done", value: followUpsDone, href: "/dashboard/networking" },
        ],
      },
    ],
  };
}
