import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { createTestDatabase, sqliteClientAvailable } from "./test-db";

/**
 * Two accounts in one database: Alpha has data in every module, Beta is brand
 * new. Beta must see none of Alpha's data through any query, and must not be
 * able to read, change or link to Alpha's records through any action, even
 * when Beta knows Alpha's record ids.
 */

const MARKER = "ALPHA-PRIVATE";

// The signed-in user for server actions.
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

const delegateName = (model: string) => model.charAt(0).toLowerCase() + model.slice(1);

describe.skipIf(!sqliteClientAvailable())("two-user data isolation", () => {
  let prisma: PrismaClient;
  let userModels: string[] = [];
  let childModels: string[] = [];
  let cleanup = () => {};
  let alpha = "";
  let beta = "";
  const ids: Record<string, string> = {};

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const table = (model: string) => (prisma as any)[delegateName(model)];

  /** Everything Alpha owns, plus all child rows (which have no userId of their own). */
  async function snapshotAlpha() {
    const out: Record<string, unknown[]> = {};
    for (const model of userModels) {
      out[model] = await table(model).findMany({ where: { userId: alpha }, orderBy: { id: "asc" } });
    }
    for (const model of childModels) {
      out[model] = await table(model).findMany({ orderBy: { id: "asc" } });
    }
    return JSON.parse(JSON.stringify(out)) as Record<string, { id: string }[]>;
  }

  async function betaRows() {
    const out: Record<string, unknown[]> = {};
    for (const model of userModels) {
      out[model] = await table(model).findMany({ where: { userId: beta } });
    }
    return out;
  }

  beforeAll(async () => {
    ({ cleanup } = createTestDatabase("isolation"));
    const { Prisma } = await import("@prisma/client");
    ({ prisma } = await import("@/lib/db"));

    const models = Prisma.dmmf.datamodel.models;
    userModels = models.filter((m) => m.fields.some((f) => f.name === "userId")).map((m) => m.name);
    childModels = models
      .filter((m) => !userModels.includes(m.name) && !["User", "InviteCode"].includes(m.name))
      .map((m) => m.name);

    alpha = (await prisma.user.create({ data: { email: "alpha@test.local", passwordHash: "x", name: "Alpha" } })).id;
    beta = (await prisma.user.create({ data: { email: "beta@test.local", passwordHash: "x", name: "Beta" } })).id;

    const { startOfDay } = await import("@/lib/date");
    const { getPeriodKey } = await import("@/lib/period");
    const now = new Date();
    const today = startOfDay(now);
    const userId = alpha;
    const text = (label: string) => `${MARKER} ${label}`;

    ids.todo = (await prisma.todo.create({ data: { userId, title: text("todo"), dayDate: today } })).id;
    await prisma.todo.create({ data: { userId, title: text("backlog"), inBacklog: true } });
    await prisma.inspiration.create({ data: { userId, text: text("inspiration") } });
    await prisma.principle.create({ data: { userId, text: text("principle"), category: "life" } });
    await prisma.lifePriority.create({ data: { userId, title: text("priority") } });
    const goal = await prisma.goal.create({
      data: { userId, title: text("goal"), period: "weekly", periodKey: getPeriodKey("weekly", now) },
    });
    ids.goal = goal.id;
    ids.milestone = (await prisma.goalMilestone.create({ data: { goalId: goal.id, title: text("milestone") } })).id;
    const meal = await prisma.defaultMeal.create({ data: { userId, name: text("default meal") } });
    ids.defaultMeal = meal.id;
    ids.food = (await prisma.foodLogEntry.create({ data: { userId, name: text("food"), date: today, eatenAt: now } })).id;
    ids.mealPlan = (await prisma.mealPlanItem.create({ data: { userId, name: text("planned meal"), date: today } })).id;
    await prisma.weatherPreference.create({
      data: { userId, locationName: text("city"), latitude: 60.17, longitude: 24.94 },
    });
    const workout = await prisma.workout.create({ data: { userId, name: text("workout"), date: today } });
    ids.workout = workout.id;
    const program = await prisma.workoutProgram.create({ data: { userId, name: text("program") } });
    ids.program = program.id;
    await prisma.prayerLog.create({ data: { userId, date: today, prayer: "fajr", status: "ontime" } });
    ids.qaza = (await prisma.qazaPrayer.create({ data: { userId, prayer: "asr", sourceDate: today } })).id;
    ids.careerGoal = (await prisma.careerGoal.create({ data: { userId, title: text("career goal") } })).id;
    ids.skill = (await prisma.skill.create({ data: { userId, name: text("skill") } })).id;
    await prisma.certification.create({ data: { userId, name: text("cert") } });
    await prisma.workExperience.create({ data: { userId, company: text("company"), role: "Engineer" } });
    await prisma.learningEntry.create({ data: { userId, title: text("learning"), date: today, skillId: ids.skill } });
    const contact = await prisma.contact.create({ data: { userId, name: text("contact") } });
    ids.contact = contact.id;
    await prisma.jobApplication.create({ data: { userId, company: text("employer"), role: "Dev", contactId: contact.id } });
    ids.interaction = (
      await prisma.interaction.create({ data: { userId, contactId: contact.id, date: now, summary: text("interaction") } })
    ).id;
    ids.followUp = (await prisma.followUp.create({ data: { userId, contactId: contact.id, note: text("follow up") } })).id;
    await prisma.journalEntry.create({ data: { userId, date: today, note: text("journal") } });
    await prisma.migraineLog.create({ data: { userId, date: today, pain: 5, note: text("migraine") } });
    const category = await prisma.budgetCategory.create({
      data: { userId, name: text("category"), slug: "alpha-private", kind: "expense" },
    });
    ids.category = category.id;
    ids.batch = (await prisma.budgetImportBatch.create({ data: { userId, filename: text("statement.csv") } })).id;
    ids.transaction = (
      await prisma.budgetTransaction.create({
        data: { userId, type: "expense", amountCents: 1234, date: today, rawDescription: text("purchase"), categoryId: category.id },
      })
    ).id;
    await prisma.budgetTransaction.create({
      data: { userId, type: "expense", amountCents: 999, date: today, rawDescription: text("uncategorized") },
    });
    ids.planBlock = (
      await prisma.planBlock.create({
        data: { userId, planDate: today, title: text("block"), startTime: "09:00", endTime: "10:00" },
      })
    ).id;
    ids.template = (await prisma.planTemplate.create({ data: { userId, name: text("template") } })).id;
    const event = await prisma.calendarEvent.create({
      data: { userId, title: text("event"), startsAt: now, endsAt: new Date(now.getTime() + 3_600_000) },
    });
    ids.event = event.id;
    ids.reminder = (await prisma.reminder.create({ data: { userId, title: text("reminder"), remindAt: now } })).id;
    await prisma.reminder.create({ data: { userId, eventId: event.id, offsetMinutes: 15 } });
    ids.notification = (
      await prisma.notification.create({
        data: { userId, title: text("notification"), dueAt: now, sourceType: "reminder", sourceId: ids.reminder, dedupeKey: "alpha-1" },
      })
    ).id;
    const workDay = await prisma.workDay.create({ data: { userId, date: today, logNote: text("work log") } });
    ids.focus = (await prisma.workFocusItem.create({ data: { userId, workDayId: workDay.id, title: text("focus") } })).id;
  }, 120_000);

  afterAll(async () => {
    await prisma?.$disconnect();
    cleanup();
  });

  /** Calls every read query as `userId`, passing Alpha's record ids wherever one is accepted. */
  async function readEverything(userId: string) {
    const date = await import("@/lib/date");
    const { getPeriodKey } = await import("@/lib/period");
    const calendar = await import("@/lib/queries/calendar");
    const budget = await import("@/lib/queries/budget");
    const planner = await import("@/lib/queries/food-planner");
    const dashboard = await import("@/lib/queries/dashboard");
    const goals = await import("@/lib/queries/goals");
    const inspirations = await import("@/lib/queries/inspirations");
    const food = await import("@/lib/queries/food");
    const notifications = await import("@/lib/queries/notifications");
    const migraine = await import("@/lib/queries/migraine");
    const networking = await import("@/lib/queries/networking");
    const plan = await import("@/lib/queries/plan");
    const principles = await import("@/lib/queries/principles");
    const religious = await import("@/lib/queries/religious");
    const todos = await import("@/lib/queries/todos");
    const priorities = await import("@/lib/queries/priorities");
    const weather = await import("@/lib/queries/weather");
    const work = await import("@/lib/queries/work");
    const { buildReport } = await import("@/lib/reports");

    const now = new Date();
    const from = date.addDays(now, -40);
    const to = date.addDays(now, 40);
    const dayKey = date.toDateInputValue(now);
    const monthKey = date.toMonthKey(now);

    return Promise.all([
      calendar.getEventsInRange(userId, from, to),
      calendar.getOccurrencesInRange(userId, from, to),
      calendar.getCalendarEvent(userId, ids.event),
      calendar.getStandaloneReminders(userId, from, to),
      calendar.getReminder(userId, ids.reminder),
      calendar.getNotifications(userId),
      calendar.getUnreadNotificationCount(userId),
      budget.getBudgetCategories(userId, true),
      budget.getMonthBudget(userId, date.startOfMonth(now)),
      budget.getUncategorizedTransactions(userId),
      budget.getUncategorizedCount(userId),
      budget.getBudgetSummaryForDashboard(userId, now),
      budget.getWeekExpenseTotal(userId, from, to),
      budget.getRangeBudget(userId, from, to),
      budget.getRangeBudget(userId, from, to, { categoryId: ids.category }),
      planner.getWeekMealPlan(userId, planner.currentWeekStartKey()),
      dashboard.getDashboardStats(userId, dayKey),
      goals.getGoalsForPeriod(userId, "weekly", getPeriodKey("weekly", now)),
      inspirations.getInspirations(userId),
      food.getFoodSettings(userId),
      food.getNutritionTarget(userId),
      food.getDayFoodEntries(userId, dayKey),
      food.getDefaultMeals(userId),
      food.getRecentFoods(userId),
      food.getFoodRange(userId, from, to),
      food.getFoodReportRange(userId, from, to),
      notifications.getNotificationFeed(userId),
      migraine.getMonthMigraineLogs(userId, monthKey),
      networking.getComposerContacts(userId),
      networking.getSuggestedTopics(userId),
      networking.getRecentActivity(userId),
      networking.getPeopleRows(userId),
      networking.getOverduePeople(userId),
      networking.getInsightsSource(userId, { from, to }),
      plan.getDayPlanBlocks(userId, dayKey),
      plan.getPlanTemplates(userId),
      plan.getDismissedSuggestionKeys(userId, dayKey),
      plan.getPlanDayStats(userId, dayKey),
      plan.getPlanPreviewBlocks(userId, dayKey),
      principles.getActivePrinciples(userId),
      principles.getPrincipleReviewedToday(userId),
      religious.getDayPrayers(userId, dayKey),
      religious.getPrayerStreak(userId, dayKey),
      religious.getReligiousSidebarData(userId, dayKey),
      todos.getDayTodos(userId, dayKey),
      todos.getBacklogTodos(userId),
      todos.getStaleOpenTodoCount(userId),
      todos.getOverdueTodoCount(userId),
      priorities.getLifePriorities(userId),
      weather.getWeatherPreference(userId),
      work.getWorkDay(userId, dayKey),
      work.getWorkLinkOptions(userId),
      buildReport(userId, "daily"),
      buildReport(userId, "weekly"),
      buildReport(userId, "monthly"),
    ]);
  }

  it("a new user starts with no data at all", async () => {
    const rows = await betaRows();
    expect(Object.entries(rows).filter(([, list]) => list.length > 0).map(([model]) => model)).toEqual([]);
  });

  it("the fixture is visible to its owner (so the checks below have teeth)", async () => {
    const seen = JSON.stringify(await readEverything(alpha));
    for (const label of ["todo", "event", "contact", "purchase", "food", "goal", "block", "focus"]) {
      expect(seen).toContain(`${MARKER} ${label}`);
    }
  });

  it("no read query returns another user's data", async () => {
    const seen = JSON.stringify(await readEverything(beta));
    expect(seen).not.toContain(MARKER);
    for (const id of Object.values(ids)) expect(seen).not.toContain(id);
  });

  it("actions cannot read, change or link to another user's records", async () => {
    const before = await snapshotAlpha();
    const alphaIds = new Set(Object.values(before).flat().map((row) => row.id));
    const day = (await import("@/lib/date")).toDateInputValue(new Date());

    const todos = await import("@/app/dashboard/todos/actions");
    const goals = await import("@/app/dashboard/goals/actions");
    const career = await import("@/app/dashboard/career/actions");
    const networking = await import("@/app/dashboard/networking/actions");
    const calendar = await import("@/app/dashboard/calendar/actions");
    const plan = await import("@/app/dashboard/plan/actions");
    const work = await import("@/app/dashboard/work/actions");
    const food = await import("@/app/dashboard/food/actions");
    const budget = await import("@/app/dashboard/budget/actions");
    const exercise = await import("@/app/dashboard/exercise/actions");
    const programs = await import("@/app/dashboard/exercise/programs/actions");
    const religious = await import("@/app/dashboard/religious/actions");
    const notifications = await import("@/app/dashboard/notifications/actions");

    const attempts: [string, () => Promise<unknown>][] = [
      // Linking to a foreign record.
      ["career.createJobApplication", () => career.createJobApplication(form({ company: "Beta Co", role: "Dev", contactId: ids.contact }))],
      ["career.createLearning", () => career.createLearning(form({ title: "Beta course", skillId: ids.skill }))],
      ["calendar.createReminder", () => calendar.createReminder(form({ title: "Beta reminder", remindAt: "2030-01-01T10:00", eventId: ids.event, offsetMinutes: "15" }))],
      ["plan.createPlanBlock", () => plan.createPlanBlock(form({ title: "Beta block", startTime: "08:00", endTime: "09:00", planDate: day, kind: "todo", linkType: "todo", linkId: ids.todo }))],
      ["plan.acceptPlanSuggestion", () => plan.acceptPlanSuggestion(form({ title: "Beta meal", startTime: "12:00", endTime: "13:00", planDate: day, kind: "meal", linkType: "meal", linkId: ids.mealPlan }))],
      ["work.createFocusItem", () => work.createFocusItem(form({ title: "Beta focus", dayDate: day, link: `skill:${ids.skill}` }))],
      ["food.logFood", () => food.logFood(form({ name: "Beta food", defaultMealId: ids.defaultMeal, day }))],
      ["food.logDefaultMeal", () => food.logDefaultMeal(form({ defaultMealId: ids.defaultMeal, day }))],
      ["food.addPlanItem", () => food.addPlanItem(form({ name: "Beta plan", date: day, defaultMealId: ids.defaultMeal }))],
      ["food.addShoppingItem", () => food.addShoppingItem(form({ mealPlanItemId: ids.mealPlan, planItemId: ids.mealPlan, name: "Beta item" }))],
      ["networking.logInteraction", async () => (networking as Record<string, unknown>).logInteraction && (networking as unknown as Record<string, (fd: FormData) => Promise<unknown>>).logInteraction(form({ contactId: ids.contact, note: "Beta note" }))],
      ["goals.addMilestone", () => goals.addMilestone(form({ goalId: ids.goal, title: "Beta milestone" }))],
      ["exercise.addExercise", () => exercise.addExercise(form({ workoutId: ids.workout, name: "Beta lift" }))],
      ["exercise.startWorkoutFromProgram", () => exercise.startWorkoutFromProgram(form({ programId: ids.program }))],
      ["programs.addProgramExercise", async () => {
        const fn = Object.values(programs).find((f) => typeof f === "function" && /add/i.test(f.name)) as ((fd: FormData) => Promise<unknown>) | undefined;
        return fn?.(form({ programId: ids.program, name: "Beta lift", plannedSets: "3", plannedReps: "8" }));
      }],
      ["budget.categorizeTransaction", () => budget.categorizeTransaction(form({ id: ids.transaction, categoryId: ids.category }))],
      ["budget.updateTransaction", () => budget.updateTransaction(form({ id: ids.transaction, type: "expense", amount: "1", date: day, categoryId: ids.category, description: "hijacked" }))],

      // Changing or deleting a foreign record by id.
      ["todos.toggleTodo", () => todos.toggleTodo(form({ id: ids.todo }))],
      ["todos.deleteTodo", () => todos.deleteTodo(form({ id: ids.todo }))],
      ["goals.toggleGoalComplete", () => goals.toggleGoalComplete(form({ id: ids.goal }))],
      ["goals.incrementGoal", () => goals.incrementGoal(form({ id: ids.goal }))],
      ["goals.deleteGoal", () => goals.deleteGoal(form({ id: ids.goal }))],
      ["goals.toggleMilestone", () => goals.toggleMilestone(form({ id: ids.milestone, goalId: ids.goal }))],
      ["goals.deleteMilestone", () => goals.deleteMilestone(form({ id: ids.milestone, goalId: ids.goal }))],
      ["career.deleteCareerGoal", () => career.deleteCareerGoal(form({ id: ids.careerGoal }))],
      ["career.updateSkillLevel", () => career.updateSkillLevel(form({ id: ids.skill, level: "5" }))],
      ["career.deleteSkill", () => career.deleteSkill(form({ id: ids.skill }))],
      ["networking.updateContact", () => networking.updateContact(form({ id: ids.contact, name: "hijacked" }))],
      ["networking.deleteContact", () => networking.deleteContact(form({ id: ids.contact }))],
      ["networking.deleteInteraction", () => networking.deleteInteraction(form({ id: ids.interaction, contactId: ids.contact }))],
      ["calendar.updateEvent", () => calendar.updateEvent(form({ id: ids.event, title: "hijacked", startsAt: "2030-01-01T10:00", endsAt: "2030-01-01T11:00" }))],
      ["calendar.deleteEvent", () => calendar.deleteEvent(form({ id: ids.event, scope: "all" }))],
      ["calendar.updateReminder", () => calendar.updateReminder(form({ id: ids.reminder, title: "hijacked", remindAt: "2030-01-01T10:00" }))],
      ["calendar.deleteReminder", () => calendar.deleteReminder(form({ id: ids.reminder }))],
      ["calendar.dismissReminder", () => calendar.dismissReminder(form({ id: ids.reminder }))],
      ["plan.updatePlanBlock", () => plan.updatePlanBlock(form({ id: ids.planBlock, title: "hijacked", startTime: "09:00", endTime: "10:00" }))],
      ["plan.togglePlanBlockStatus", () => plan.togglePlanBlockStatus(form({ id: ids.planBlock }))],
      ["plan.deletePlanBlock", () => plan.deletePlanBlock(form({ id: ids.planBlock }))],
      ["plan.applyPlanTemplate", () => plan.applyPlanTemplate(form({ templateId: ids.template, planDate: day }))],
      ["plan.deletePlanTemplate", () => plan.deletePlanTemplate(form({ id: ids.template }))],
      ["work.toggleFocusItem", () => work.toggleFocusItem(form({ id: ids.focus }))],
      ["work.deleteFocusItem", () => work.deleteFocusItem(form({ id: ids.focus }))],
      ["food.updateFood", () => food.updateFood(form({ id: ids.food, name: "hijacked" }))],
      ["food.deleteFood", () => food.deleteFood(form({ id: ids.food }))],
      ["food.deleteDefaultMeal", () => food.deleteDefaultMeal(form({ id: ids.defaultMeal }))],
      ["food.deletePlanItem", () => food.deletePlanItem(form({ id: ids.mealPlan }))],
      ["food.logFromPlan", () => food.logFromPlan(form({ id: ids.mealPlan }))],
      ["budget.deleteTransaction", () => budget.deleteTransaction(form({ id: ids.transaction }))],
      ["budget.undoImportBatch", () => budget.undoImportBatch(form({ batchId: ids.batch, id: ids.batch }))],
      ["budget.renameCategory", () => budget.renameCategory(form({ id: ids.category, name: "hijacked" }))],
      ["budget.toggleCategoryHidden", () => budget.toggleCategoryHidden(form({ id: ids.category }))],
      ["exercise.deleteWorkout", () => exercise.deleteWorkout(form({ id: ids.workout }))],
      ["religious.fulfillQaza", () => religious.fulfillQaza(form({ id: ids.qaza }))],
      ["notifications.markNotificationRead", () => notifications.markNotificationRead(form({ id: ids.notification }))],
    ];

    currentUserId = beta;
    for (const [, attempt] of attempts) {
      // Rejections and redirects are fine; what matters is the database state.
      await attempt().catch(() => undefined);
    }

    // Alpha's data is untouched.
    expect(await snapshotAlpha()).toEqual(before);

    // Nothing Beta now owns points at, or was copied from, Alpha's records.
    const mine = JSON.stringify(await betaRows());
    expect(mine).not.toContain(MARKER);
    for (const id of alphaIds) expect(mine).not.toContain(id);

    // And Alpha's event did not gain a reminder from Beta.
    expect(await prisma.reminder.count({ where: { eventId: ids.event, userId: { not: alpha } } })).toBe(0);
  }, 60_000);
});
