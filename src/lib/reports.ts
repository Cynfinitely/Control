import { prisma } from "@/lib/db";
import { rangeFor } from "@/lib/date";

export type Period = "daily" | "weekly" | "monthly";

export async function buildReport(userId: string, period: Period) {
  const { from, to } = rangeFor(period);

  const [
    todosCompleted,
    todosCreated,
    backlogCount,
    activeGoals,
    completedGoals,
    foodEntries,
    target,
    workouts,
    weights,
    prayers,
    qazaFulfilled,
    qazaPending,
    dhikr,
    quran,
    fasts,
    learning,
    interactions,
    followUpsDone,
  ] = await Promise.all([
    prisma.todo.count({ where: { userId, completedAt: { gte: from, lte: to } } }),
    prisma.todo.count({ where: { userId, createdAt: { gte: from, lte: to }, deletedAt: null } }),
    prisma.todo.count({ where: { userId, inBacklog: true, status: "open", deletedAt: null } }),
    prisma.goal.count({ where: { userId, status: "active", deletedAt: null } }),
    prisma.goal.count({ where: { userId, status: "completed", updatedAt: { gte: from, lte: to } } }),
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
    prisma.dhikrLog.findMany({ where: { userId, date: { gte: from, lte: to } } }),
    prisma.quranProgress.findMany({ where: { userId, date: { gte: from, lte: to } } }),
    prisma.fastingLog.count({ where: { userId, date: { gte: from, lte: to } } }),
    prisma.learningEntry.findMany({ where: { userId, deletedAt: null, date: { gte: from, lte: to } } }),
    prisma.interaction.count({ where: { userId, date: { gte: from, lte: to } } }),
    prisma.followUp.count({ where: { userId, done: true } }),
  ]);

  const days = Math.max(1, Math.round((to.getTime() - from.getTime()) / 86400000));
  const totalCalories = foodEntries.reduce((s, f) => s + f.calories, 0);
  const avgCalories = foodEntries.length ? totalCalories / days : 0;
  const calorieTarget = target?.calories ?? 2000;

  const gymWorkouts = workouts.filter((w) => w.activityType === "gym");
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
          { label: "Todos completed", value: todosCompleted },
          { label: "Todos created", value: todosCreated },
          { label: "In backlog", value: backlogCount },
        ],
      },
      {
        title: "Goals",
        stats: [
          { label: "Active goals", value: activeGoals },
          { label: "Completed this period", value: completedGoals },
        ],
      },
      {
        title: "Nutrition",
        stats: [
          { label: "Avg calories/day", value: Math.round(avgCalories) },
          { label: "Daily target", value: Math.round(calorieTarget) },
          { label: "Food entries", value: foodEntries.length },
        ],
      },
      {
        title: "Fitness",
        stats: [
          { label: "Workouts", value: workouts.length },
          { label: "Gym sessions", value: gymWorkouts.length },
          { label: "Cardio (min)", value: totalCardioMin },
          { label: "Gym sets", value: totalSets },
          { label: "Weight change", value: weightDelta === null ? "-" : `${weightDelta > 0 ? "+" : ""}${weightDelta.toFixed(1)} kg` },
        ],
      },
      {
        title: "Religious",
        stats: [
          { label: "Prayers on time", value: prayersOnTime },
          { label: "Prayers missed", value: prayersMissed },
          { label: "On-time rate", value: `${prayerOnTimeRate}%` },
          { label: "Qaza fulfilled", value: qazaFulfilled },
          { label: "Qaza pending", value: qazaPending },
          { label: "Dhikr total", value: dhikrTotal },
          { label: "Quran pages", value: quranPages },
          { label: "Fasting days", value: fasts },
        ],
      },
      {
        title: "Career",
        stats: [
          { label: "Learning entries", value: learning.length },
          { label: "Learning hours", value: Math.round(learningHours) },
        ],
      },
      {
        title: "Networking",
        stats: [
          { label: "Interactions", value: interactions },
          { label: "Follow-ups done (all time)", value: followUpsDone },
        ],
      },
    ],
  };
}
