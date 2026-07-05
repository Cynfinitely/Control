import { prisma } from "@/lib/db";
import { startOfDay, endOfDay, startOfWeek, addDays } from "@/lib/date";
import { formatMinutesToTime, parseTimeToMinutes } from "@/lib/plan/time";
import { blocksOverlap } from "@/lib/plan/overlap";

export type PlanSuggestion = {
  key: string;
  title: string;
  startTime: string;
  endTime: string;
  kind: string;
  linkType?: string;
  linkId?: string;
  reason: string;
};

const MEAL_TIMES: Record<string, { start: string; end: string }> = {
  breakfast: { start: "08:00", end: "08:45" },
  lunch: { start: "13:00", end: "13:45" },
  dinner: { start: "19:00", end: "19:45" },
  snack: { start: "16:00", end: "16:30" },
};

const PRAYER_SLOTS: { prayer: string; title: string; start: string; end: string }[] = [
  { prayer: "fajr", title: "Fajr", start: "05:30", end: "06:00" },
  { prayer: "dhuhr", title: "Dhuhr", start: "13:00", end: "13:30" },
  { prayer: "asr", title: "Asr", start: "16:30", end: "17:00" },
  { prayer: "maghrib", title: "Maghrib", start: "19:45", end: "20:15" },
  { prayer: "isha", title: "Isha", start: "21:00", end: "21:30" },
];

const PRIORITY_OFFSET: Record<string, number> = {
  high: 0,
  medium: 30,
  low: 60,
};

function slotFits(
  existing: { startTime: string; endTime: string }[],
  startTime: string,
  endTime: string
): boolean {
  return !existing.some((b) => blocksOverlap(b, { startTime, endTime }));
}

function nextFreeSlot(
  existing: { startTime: string; endTime: string }[],
  preferredStart: string,
  durationMinutes: number
): { startTime: string; endTime: string } {
  let start = parseTimeToMinutes(preferredStart) ?? 540;
  for (let attempt = 0; attempt < 48; attempt++) {
    const end = start + durationMinutes;
    if (end > 24 * 60) break;
    const startTime = formatMinutesToTime(start);
    const endTime = formatMinutesToTime(end);
    if (slotFits(existing, startTime, endTime)) {
      return { startTime, endTime };
    }
    start += 15;
  }
  const fallbackStart = formatMinutesToTime(Math.min(start, 22 * 60));
  const fallbackEnd = formatMinutesToTime(Math.min(start + durationMinutes, 23 * 60 + 45));
  return { startTime: fallbackStart, endTime: fallbackEnd };
}

function alreadyLinked(
  existing: { linkType: string | null; linkId: string | null }[],
  linkType: string,
  linkId: string
): boolean {
  return existing.some((b) => b.linkType === linkType && b.linkId === linkId);
}

export async function getPlanSuggestions(
  userId: string,
  dayKey: string,
  dismissedKeys: string[]
): Promise<PlanSuggestion[]> {
  const day = new Date(dayKey + "T00:00:00");
  const from = startOfDay(day);
  const to = endOfDay(day);
  const weekStart = startOfWeek(day);
  const weekEnd = endOfDay(addDays(weekStart, 6));

  const [todos, meals, followUps, workoutsThisWeek, existingBlocks] = await Promise.all([
    prisma.todo.findMany({
      where: {
        userId,
        deletedAt: null,
        inBacklog: false,
        status: "open",
        dayDate: { gte: from, lte: to },
      },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
      select: { id: true, title: true, priority: true },
    }),
    prisma.mealPlanItem.findMany({
      where: { userId, deletedAt: null, date: { gte: from, lte: to } },
      select: { id: true, name: true, meal: true },
    }),
    prisma.followUp.findMany({
      where: {
        userId,
        done: false,
        dueDate: { gte: from, lte: to },
      },
      select: { id: true, note: true },
    }),
    prisma.workout.count({
      where: { userId, deletedAt: null, date: { gte: weekStart, lte: weekEnd } },
    }),
    prisma.planBlock.findMany({
      where: { userId, deletedAt: null, planDate: { gte: from, lte: to } },
      select: { startTime: true, endTime: true, linkType: true, linkId: true, kind: true, title: true },
    }),
  ]);

  const suggestions: PlanSuggestion[] = [];
  const occupied: { startTime: string; endTime: string }[] = existingBlocks.map((b) => ({
    startTime: b.startTime,
    endTime: b.endTime,
  }));

  for (const todo of todos) {
    const key = `todo:${todo.id}`;
    if (dismissedKeys.includes(key) || alreadyLinked(existingBlocks, "todo", todo.id)) continue;
    const offset = PRIORITY_OFFSET[todo.priority] ?? 30;
    const slot = nextFreeSlot(occupied, formatMinutesToTime(540 + offset), 45);
    suggestions.push({
      key,
      title: todo.title,
      startTime: slot.startTime,
      endTime: slot.endTime,
      kind: "todo",
      linkType: "todo",
      linkId: todo.id,
      reason: "Open todo for today",
    });
    occupied.push(slot);
  }

  for (const meal of meals) {
    const key = `meal:${meal.id}`;
    if (dismissedKeys.includes(key) || alreadyLinked(existingBlocks, "meal", meal.id)) continue;
    const mealSlot = MEAL_TIMES[meal.meal] ?? MEAL_TIMES.lunch;
    const slot = slotFits(occupied, mealSlot.start, mealSlot.end)
      ? { startTime: mealSlot.start, endTime: mealSlot.end }
      : nextFreeSlot(occupied, mealSlot.start, 45);
    suggestions.push({
      key,
      title: meal.name,
      startTime: slot.startTime,
      endTime: slot.endTime,
      kind: "meal",
      linkType: "meal",
      linkId: meal.id,
      reason: `Meal plan: ${meal.meal}`,
    });
    occupied.push(slot);
  }

  for (const prayer of PRAYER_SLOTS) {
    const key = `prayer:${prayer.prayer}`;
    if (dismissedKeys.includes(key)) continue;
    if (existingBlocks.some((b) => b.kind === "prayer" && b.title.toLowerCase() === prayer.title.toLowerCase())) continue;
    const slot = slotFits(occupied, prayer.start, prayer.end)
      ? { startTime: prayer.start, endTime: prayer.end }
      : nextFreeSlot(occupied, prayer.start, 30);
    suggestions.push({
      key,
      title: prayer.title,
      startTime: slot.startTime,
      endTime: slot.endTime,
      kind: "prayer",
      reason: "Daily prayer",
    });
    occupied.push(slot);
  }

  for (const followUp of followUps) {
    const key = `followup:${followUp.id}`;
    if (dismissedKeys.includes(key) || alreadyLinked(existingBlocks, "followup", followUp.id)) continue;
    const slot = nextFreeSlot(occupied, "10:00", 30);
    suggestions.push({
      key,
      title: followUp.note,
      startTime: slot.startTime,
      endTime: slot.endTime,
      kind: "followup",
      linkType: "followup",
      linkId: followUp.id,
      reason: "Follow-up due today",
    });
    occupied.push(slot);
  }

  if (workoutsThisWeek === 0 && !dismissedKeys.includes("workout:generic")) {
    const hasWorkout = existingBlocks.some((b) => b.kind === "workout");
    if (!hasWorkout) {
      const slot = nextFreeSlot(occupied, "07:00", 60);
      suggestions.push({
        key: "workout:generic",
        title: "Workout",
        startTime: slot.startTime,
        endTime: slot.endTime,
        kind: "workout",
        reason: "No workouts logged this week",
      });
    }
  }

  return suggestions;
}
