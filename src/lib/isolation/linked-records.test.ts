import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { createTestDatabase, sqliteClientAvailable } from "./test-db";

/**
 * Behaviour that spans modules, against a real database: goals that count
 * logged activity (and un-count it when the activity is deleted), and the
 * link between missed prayers and qaza.
 */

let currentUserId = "";

vi.mock("@/lib/auth", () => ({
  auth: async () => ({ user: { id: currentUserId, role: "user" } }),
}));
vi.mock("next/cache", () => ({
  unstable_cache: (fn: () => unknown) => fn,
  revalidateTag: () => {},
  revalidatePath: () => {},
}));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`NEXT_REDIRECT ${url}`);
  },
}));

function form(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) fd.set(key, value);
  return fd;
}

describe.skipIf(!sqliteClientAvailable())("linked records across modules", () => {
  let prisma: PrismaClient;
  let cleanup = () => {};
  let userId = "";
  let today = "";

  async function makeGoal(linkType: string, targetValue: number) {
    const { getPeriodKey } = await import("@/lib/period");
    return prisma.goal.create({
      data: {
        userId,
        title: `${linkType} goal`,
        type: "numeric",
        linkType,
        targetValue,
        period: "weekly",
        periodKey: getPeriodKey("weekly", new Date()),
      },
    });
  }
  const goalState = (id: string) =>
    prisma.goal.findUniqueOrThrow({ where: { id }, select: { currentValue: true, status: true } });

  beforeAll(async () => {
    ({ cleanup } = createTestDatabase("linked"));
    ({ prisma } = await import("@/lib/db"));
    userId = (await prisma.user.create({ data: { email: "u@test.local", passwordHash: "x" } })).id;
    currentUserId = userId;
    today = (await import("@/lib/date")).toDateInputValue(new Date());
  }, 120_000);

  afterAll(async () => {
    await prisma?.$disconnect();
    cleanup();
  });

  it("a workout counts towards a linked goal, and deleting it takes it back", async () => {
    const exercise = await import("@/app/dashboard/exercise/actions");
    const goal = await makeGoal("workout", 1);

    await exercise.createCardioWorkout(form({ activityType: "run", date: today, distanceKm: "5", durationMin: "30" }));
    expect(await goalState(goal.id)).toEqual({ currentValue: 1, status: "completed" });

    const workout = await prisma.workout.findFirstOrThrow({ where: { userId, deletedAt: null } });
    expect((await exercise.deleteWorkout(form({ id: workout.id }))).ok).toBe(true);
    expect(await goalState(goal.id)).toEqual({ currentValue: 0, status: "active" });
    expect(await prisma.goalCheckIn.count({ where: { goalId: goal.id } })).toBe(0);

    // Deleting the same workout twice must not go below what was added.
    expect((await exercise.deleteWorkout(form({ id: workout.id }))).ok).toBe(false);
    expect((await goalState(goal.id)).currentValue).toBe(0);
  });

  it("learning hours count towards a linked goal, 0 hours add nothing, and deleting takes the hours back", async () => {
    const career = await import("@/app/dashboard/career/actions");
    const goal = await makeGoal("learning", 10);

    await career.createLearning(form({ title: "No hours", date: today }));
    expect((await goalState(goal.id)).currentValue).toBe(0);

    await career.createLearning(form({ title: "Course", date: today, hours: "3" }));
    await career.createLearning(form({ title: "Book", date: today, hours: "2" }));
    expect((await goalState(goal.id)).currentValue).toBe(5);

    const course = await prisma.learningEntry.findFirstOrThrow({ where: { userId, title: "Course" } });
    expect((await career.deleteLearning(form({ id: course.id }))).ok).toBe(true);
    expect((await goalState(goal.id)).currentValue).toBe(2);

    expect((await career.deleteLearning(form({ id: course.id }))).ok).toBe(false);
    expect((await goalState(goal.id)).currentValue).toBe(2);
  });

  it("deleting an activity leaves a goal alone when the count was already corrected by hand", async () => {
    const career = await import("@/app/dashboard/career/actions");
    const goals = await import("@/app/dashboard/goals/actions");
    const goal = await makeGoal("learning", 50);
    const before = (await goalState(goal.id)).currentValue;

    await career.createLearning(form({ title: "Workshop", date: today, hours: "4" }));
    await goals.decrementGoal(form({ id: goal.id }));
    expect((await goalState(goal.id)).currentValue).toBe(before);

    const entry = await prisma.learningEntry.findFirstOrThrow({ where: { userId, title: "Workshop" } });
    await career.deleteLearning(form({ id: entry.id }));
    expect((await goalState(goal.id)).currentValue).toBe(before);
  });

  it("a missed prayer creates one qaza, and re-marking it after it was made up does not add another", async () => {
    const religious = await import("@/app/dashboard/religious/actions");
    const { getDayMadeUpPrayers } = await import("@/lib/queries/religious");
    const qazaCount = () => prisma.qazaPrayer.count({ where: { userId, prayer: "fajr" } });

    await religious.setPrayer(form({ prayer: "fajr", status: "missed", date: today }));
    expect(await qazaCount()).toBe(1);
    expect(await getDayMadeUpPrayers(userId, today)).toEqual([]);

    const qaza = await prisma.qazaPrayer.findFirstOrThrow({ where: { userId, prayer: "fajr" } });
    await prisma.qazaPrayer.update({ where: { id: qaza.id }, data: { fulfilledAt: new Date() } });
    expect(await getDayMadeUpPrayers(userId, today)).toEqual(["fajr"]);

    await religious.clearPrayer(form({ prayer: "fajr", date: today }));
    await religious.setPrayer(form({ prayer: "fajr", status: "missed", date: today }));
    expect(await qazaCount()).toBe(1);
    expect(await prisma.qazaPrayer.count({ where: { userId, prayer: "fajr", fulfilledAt: null } })).toBe(0);
  });

  it("refuses to log prayers for a future day", async () => {
    const religious = await import("@/app/dashboard/religious/actions");
    const { addDays, toDateInputValue } = await import("@/lib/date");
    const future = toDateInputValue(addDays(new Date(), 5));

    expect((await religious.setPrayer(form({ prayer: "isha", status: "ontime", date: future }))).ok).toBe(false);
    expect((await religious.markAllPrayersOnTime(form({ date: future }))).ok).toBe(false);
    expect(await prisma.prayerLog.count({ where: { userId, prayer: "isha" } })).toBe(0);

    expect((await religious.setPrayer(form({ prayer: "isha", status: "ontime", date: today }))).ok).toBe(true);
  });
});
