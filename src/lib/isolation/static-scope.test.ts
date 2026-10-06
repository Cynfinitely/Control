import path from "node:path";
import { describe, expect, it } from "vitest";
import { scanPrismaCalls } from "./scan";

/**
 * Regression guard for per-user data isolation.
 *
 * Every Prisma call on user data must name `userId` in its arguments. The only
 * exceptions are the reviewed call sites below, each of which runs after an
 * ownership check in the same function (or targets a child table whose parent
 * was just verified).
 *
 * If this test fails after you add a query: filter it by `userId`. Only add to
 * the list when the row was already proven to belong to the current user, and
 * say why in the review.
 */

/** Account-level tables that are not per-user data. */
const GLOBAL_MODELS = new Set(["user", "inviteCode", "verificationToken"]);

/** "file::model.method" -> number of reviewed calls without `userId` in their arguments. */
const REVIEWED: Record<string, number> = {
  // Updates by id directly after a findFirst({ id, userId }) in the same function.
  "src/app/dashboard/budget/actions.ts::budgetCategory.update": 2,
  "src/app/dashboard/budget/actions.ts::budgetImportBatch.update": 1,
  "src/app/dashboard/budget/actions.ts::budgetTransaction.update": 2,
  "src/app/dashboard/calendar/actions.ts::calendarEvent.update": 4,
  "src/app/dashboard/food/actions.ts::defaultMeal.update": 1,
  "src/app/dashboard/food/actions.ts::mealPlanItem.update": 1,
  "src/app/dashboard/food/actions.ts::waterLog.delete": 1,
  "src/app/dashboard/food/actions.ts::waterLog.update": 1,
  "src/app/dashboard/priorities/actions.ts::lifePriority.update": 2,
  "src/app/dashboard/religious/actions.ts::dailyReadingItem.update": 1,
  "src/app/dashboard/religious/actions.ts::prayerDebt.update": 1,
  "src/app/dashboard/religious/actions.ts::prayerLog.delete": 1,
  "src/app/dashboard/religious/actions.ts::qazaPrayer.delete": 2,
  "src/lib/goal-links.ts::goal.update": 2,

  // Child tables without their own userId; the parent is ownership-checked first.
  "src/app/dashboard/calendar/actions.ts::calendarEventException.upsert": 2,
  "src/app/dashboard/exercise/actions.ts::exerciseSet.count": 1,
  "src/app/dashboard/exercise/actions.ts::exerciseSet.create": 1,
  "src/app/dashboard/exercise/actions.ts::exerciseSet.delete": 1,
  "src/app/dashboard/exercise/actions.ts::workoutExercise.count": 1,
  "src/app/dashboard/exercise/actions.ts::workoutExercise.create": 1,
  "src/app/dashboard/exercise/actions.ts::workoutExercise.delete": 1,
  "src/app/dashboard/exercise/programs/actions.ts::workoutProgramExercise.count": 1,
  "src/app/dashboard/exercise/programs/actions.ts::workoutProgramExercise.create": 1,
  "src/app/dashboard/exercise/programs/actions.ts::workoutProgramExercise.delete": 1,
  "src/app/dashboard/exercise/programs/actions.ts::workoutProgramExercise.findMany": 1,
  "src/app/dashboard/exercise/programs/actions.ts::workoutProgramExercise.update": 3,
  "src/app/dashboard/food/actions.ts::defaultMealItem.createMany": 1,
  "src/app/dashboard/food/actions.ts::defaultMealItem.deleteMany": 1,
  "src/app/dashboard/food/actions.ts::shoppingItem.create": 1,
  "src/app/dashboard/goals/actions.ts::goalCheckIn.create": 1,
  "src/app/dashboard/goals/actions.ts::goalCheckIn.delete": 1,
  "src/app/dashboard/goals/actions.ts::goalCheckIn.findFirst": 1,
  "src/app/dashboard/goals/actions.ts::goalMilestone.create": 1,
  "src/app/dashboard/goals/actions.ts::goalMilestone.delete": 1,
  "src/app/dashboard/goals/actions.ts::goalMilestone.update": 1,
  "src/app/dashboard/plan/actions.ts::planTemplateBlock.createMany": 1,
  "src/lib/goal-links.ts::goalCheckIn.create": 1,
  "src/lib/goal-links.ts::goalCheckIn.delete": 1,
  "src/lib/goal-links.ts::goalCheckIn.findFirst": 1,

  // Scoped through a WorkDay fetched by { userId, date }.
  "src/app/dashboard/work/actions.ts::workFocusItem.aggregate": 1,
  "src/app/dashboard/work/actions.ts::workFocusItem.count": 1,

  // Rows are built from a list that already carries userId on every element.
  "src/app/dashboard/plan/actions.ts::planBlock.createMany": 1,

  // The shared `where` object is built from { userId, ... } just above the calls.
  "src/lib/queries/budget.ts::budgetTransaction.count": 2,
  "src/lib/queries/budget.ts::budgetTransaction.findMany": 2,
};

describe("per-user query scoping", () => {
  const calls = scanPrismaCalls(path.resolve(__dirname, "../../.."));

  it("finds the app's Prisma calls", () => {
    expect(calls.length).toBeGreaterThan(300);
  });

  it("every query on user data is filtered by userId or individually reviewed", () => {
    const found: Record<string, number> = {};
    const lines: Record<string, number[]> = {};
    for (const call of calls) {
      if (GLOBAL_MODELS.has(call.model)) continue;
      if (/\buserId\b/.test(call.args)) continue;
      const key = `${call.file}::${call.model}.${call.method}`;
      found[key] = (found[key] ?? 0) + 1;
      (lines[key] ??= []).push(call.line);
    }

    const unreviewed = Object.entries(found)
      .filter(([key, count]) => count > (REVIEWED[key] ?? 0))
      .map(([key, count]) => `${key} (lines ${lines[key].join(", ")}): ${count} found, ${REVIEWED[key] ?? 0} reviewed`);

    expect(unreviewed).toEqual([]);
  });

  it("the reviewed list has no stale entries", () => {
    const found = new Set(
      calls
        .filter((c) => !GLOBAL_MODELS.has(c.model) && !/\buserId\b/.test(c.args))
        .map((c) => `${c.file}::${c.model}.${c.method}`)
    );
    expect(Object.keys(REVIEWED).filter((key) => !found.has(key))).toEqual([]);
  });
});
