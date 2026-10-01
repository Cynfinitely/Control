"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getUserId, str, optStr, num, parseDate } from "@/lib/actions";
import { revalidateUserCache } from "@/lib/cache";
import { success, failure, wrapFormAction, type ActionResult } from "@/lib/action-result";
import { endOfDay, parseDayParam, startOfDay } from "@/lib/date";
import { joinItems, splitItems } from "@/lib/food/items";
import { parseFoodMode, serializeMealLabels } from "@/lib/food/meals";
import { instantFromLocal } from "@/lib/food/insights";
import { getUserTimezone } from "@/lib/queries/food";
import { DateTime } from "luxon";

function invalidateFood(userId: string) {
  revalidateUserCache(userId, "dashboard", "food");
  revalidatePath("/dashboard/food", "layout");
}

function invalidatePlanner(userId: string) {
  revalidateUserCache(userId, "food-planner");
  revalidatePath("/dashboard/food/planner");
}

type NutritionInput = { calories: number; protein: number; carbs: number; fat: number };

function readNutrition(formData: FormData): NutritionInput {
  return {
    calories: Math.max(0, num(formData.get("calories"))),
    protein: Math.max(0, num(formData.get("protein"))),
    carbs: Math.max(0, num(formData.get("carbs"))),
    fat: Math.max(0, num(formData.get("fat"))),
  };
}

function readHunger(formData: FormData): number | null {
  const n = num(formData.get("hunger"), 0);
  return n >= 1 && n <= 5 ? Math.round(n) : null;
}

/** Reads `time` ("HH:MM") on the diary `day` in the user's timezone. */
async function readEatenAt(formData: FormData, userId: string): Promise<Date | null> {
  const time = str(formData.get("time"));
  if (!time) return null;
  const timeZone = await getUserTimezone(userId);
  const day = str(formData.get("day")) || DateTime.now().setZone(timeZone).toISODate() || "";
  return instantFromLocal(day, time, timeZone);
}

/** Day bucket: explicit `day` (diary day), else legacy `date`, else the day of eatenAt. */
function readDay(formData: FormData, eatenAt: Date | null): Date {
  const day = str(formData.get("day"));
  if (/^\d{4}-\d{2}-\d{2}$/.test(day)) return parseDayParam(day);
  if (formData.get("date")) return parseDate(formData.get("date"));
  return startOfDay(eatenAt ?? new Date());
}

function readItemsText(formData: FormData): string | null {
  const items = splitItems(str(formData.get("items")));
  return items.length > 0 ? joinItems(items) : null;
}

async function ownedDefaultMeal(userId: string, id: string) {
  if (!id) return null;
  return prisma.defaultMeal.findFirst({
    where: { id, userId, deletedAt: null },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });
}

export async function logFood(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const name = str(formData.get("name"));
  if (!name) return failure("Food name is required");
  const defaultMeal = await ownedDefaultMeal(userId, str(formData.get("defaultMealId")));
  const eatenAt = (await readEatenAt(formData, userId)) ?? (formData.get("date") ? null : new Date());
  await prisma.foodLogEntry.create({
    data: {
      userId,
      name,
      meal: optStr(formData.get("meal")),
      items: readItemsText(formData),
      note: optStr(formData.get("note")),
      hunger: readHunger(formData),
      eatenAt,
      date: readDay(formData, eatenAt),
      defaultMealId: defaultMeal?.id ?? null,
      ...readNutrition(formData),
    },
  });
  invalidateFood(userId);
  return success("Logged");
}

export const logFoodForm = wrapFormAction(logFood, "Logged");

export async function logDefaultMeal(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const meal = await ownedDefaultMeal(userId, str(formData.get("defaultMealId")));
  if (!meal) return failure("Default Meal not found");
  const eatenAt = (await readEatenAt(formData, userId)) ?? new Date();
  await prisma.foodLogEntry.create({
    data: {
      userId,
      name: meal.name,
      meal: meal.meal,
      items: meal.items.length > 0 ? joinItems(meal.items.map((i) => i.name)) : null,
      eatenAt,
      date: readDay(formData, eatenAt),
      defaultMealId: meal.id,
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fat: meal.fat,
    },
  });
  invalidateFood(userId);
  return success(`Logged ${meal.name}`);
}

export async function updateFood(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  const name = str(formData.get("name"));
  if (!name) return failure("Food name is required");
  const eatenAt = await readEatenAt(formData, userId);
  const result = await prisma.foodLogEntry.updateMany({
    where: { id, userId, deletedAt: null },
    data: {
      name,
      meal: optStr(formData.get("meal")),
      items: readItemsText(formData),
      note: optStr(formData.get("note")),
      hunger: readHunger(formData),
      ...(eatenAt ? { eatenAt } : {}),
      ...(formData.has("calories") ? readNutrition(formData) : {}),
    },
  });
  if (result.count === 0) return failure("Entry not found");
  invalidateFood(userId);
  return success("Saved");
}

export async function deleteFood(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  const result = await prisma.foodLogEntry.updateMany({
    where: { id, userId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  if (result.count === 0) return failure("Entry not found");
  invalidateFood(userId);
  return success("Entry deleted");
}

export async function saveTarget(formData: FormData) {
  const userId = await getUserId();
  const calories = num(formData.get("calories"), 2000);
  const protein = num(formData.get("protein"), 120);
  const carbs = num(formData.get("carbs"), 220);
  const fat = num(formData.get("fat"), 70);
  await prisma.nutritionTarget.upsert({
    where: { userId },
    update: { calories, protein, carbs, fat },
    create: { userId, calories, protein, carbs, fat },
  });
  invalidateFood(userId);
  return success("Targets saved");
}

export const saveTargetForm = wrapFormAction(saveTarget, "Targets saved");

export async function logWater(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const glasses = num(formData.get("glasses"), 1);
  const day = str(formData.get("day")) || str(formData.get("date"));
  const date = /^\d{4}-\d{2}-\d{2}$/.test(day) ? parseDayParam(day) : parseDate(formData.get("date"));
  await prisma.waterLog.create({ data: { userId, date, glasses } });
  invalidateFood(userId);
  return success("Water logged");
}

/** Undo one glass for the day, never going below zero. */
export async function removeWater(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const day = str(formData.get("day"));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return failure("Invalid day");
  const date = parseDayParam(day);
  const range = { gte: startOfDay(date), lte: endOfDay(date) };
  const latest = await prisma.waterLog.findFirst({
    where: { userId, date: range, glasses: { gt: 0 } },
    orderBy: { createdAt: "desc" },
  });
  if (!latest) return failure("No water logged for this day");
  if (latest.glasses > 1) {
    await prisma.waterLog.update({ where: { id: latest.id }, data: { glasses: { decrement: 1 } } });
  } else {
    await prisma.waterLog.delete({ where: { id: latest.id } });
  }
  invalidateFood(userId);
  return success("Removed 1 glass");
}

export async function saveFoodPreferences(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const mode = parseFoodMode(str(formData.get("mode")));
  const mealLabels = serializeMealLabels(str(formData.get("mealLabels")).split(/\r?\n/));
  await prisma.foodPreference.upsert({
    where: { userId },
    update: { mode, mealLabels },
    create: { userId, mode, mealLabels },
  });
  invalidateFood(userId);
  return success("Preferences saved");
}

export const saveFoodPreferencesForm = wrapFormAction(saveFoodPreferences, "Preferences saved");

function itemRows(itemsText: string) {
  return splitItems(itemsText).map((name, sortOrder) => ({ name, sortOrder }));
}

/**
 * Creates or updates a Default Meal. With `linkByName`, past entries with the exact same
 * name (not yet linked) are attributed to it so usage stats include them.
 */
export async function upsertDefaultMeal(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  const name = str(formData.get("name"));
  if (!name) return failure("Name is required");
  const data = {
    name,
    meal: optStr(formData.get("meal")),
    ...readNutrition(formData),
  };
  const items = itemRows(str(formData.get("items")));

  let mealId: string;
  if (id) {
    const existing = await ownedDefaultMeal(userId, id);
    if (!existing) return failure("Default Meal not found");
    await prisma.$transaction([
      prisma.defaultMeal.update({ where: { id }, data }),
      prisma.defaultMealItem.deleteMany({ where: { defaultMealId: id } }),
      prisma.defaultMealItem.createMany({ data: items.map((i) => ({ ...i, defaultMealId: id })) }),
    ]);
    mealId = id;
  } else {
    const created = await prisma.defaultMeal.create({
      data: { userId, ...data, items: { create: items } },
    });
    mealId = created.id;
  }

  if (formData.get("linkByName")) {
    await prisma.foodLogEntry.updateMany({
      where: { userId, name, defaultMealId: null, deletedAt: null },
      data: { defaultMealId: mealId },
    });
  }

  invalidateFood(userId);
  invalidatePlanner(userId);
  return success(id ? "Default Meal saved" : "Default Meal created");
}

export const upsertDefaultMealForm = wrapFormAction(upsertDefaultMeal);

export async function saveEntryAsDefault(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const entryId = str(formData.get("id"));
  const entry = await prisma.foodLogEntry.findFirst({ where: { id: entryId, userId, deletedAt: null } });
  if (!entry) return failure("Entry not found");
  if (entry.defaultMealId) return failure("Already logged from a Default Meal");
  const created = await prisma.defaultMeal.create({
    data: {
      userId,
      name: entry.name,
      meal: entry.meal,
      calories: entry.calories,
      protein: entry.protein,
      carbs: entry.carbs,
      fat: entry.fat,
      items: { create: itemRows(entry.items ?? "") },
    },
  });
  await prisma.foodLogEntry.updateMany({
    where: { userId, name: entry.name, defaultMealId: null, deletedAt: null },
    data: { defaultMealId: created.id },
  });
  invalidateFood(userId);
  invalidatePlanner(userId);
  return success(`Saved "${entry.name}" as a Default Meal`);
}

export async function deleteDefaultMeal(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  await prisma.defaultMeal.updateMany({
    where: { id, userId },
    data: { deletedAt: new Date() },
  });
  invalidateFood(userId);
  invalidatePlanner(userId);
  return success("Default Meal removed");
}

export async function logFromPlan(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const planId = str(formData.get("planId"));
  const item = await prisma.mealPlanItem.findFirst({
    where: { id: planId, userId, deletedAt: null },
    include: { ingredients: { orderBy: { createdAt: "asc" } } },
  });
  if (!item) return failure("Planned meal not found");
  if (item.loggedAt && !formData.get("again")) {
    return failure(`“${item.name}” is already in your diary. Use “Log again” to add it twice.`);
  }
  await prisma.$transaction([
    prisma.foodLogEntry.create({
      data: {
        userId,
        name: item.name,
        meal: item.meal,
        items: item.ingredients.length > 0 ? joinItems(item.ingredients.map((i) => i.name)) : null,
        defaultMealId: item.defaultMealId,
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
        date: item.date,
      },
    }),
    prisma.mealPlanItem.update({ where: { id: item.id }, data: { loggedAt: new Date() } }),
  ]);
  invalidateFood(userId);
  invalidatePlanner(userId);
  return success(`Logged “${item.name}” to your diary`);
}

export async function addPlanItem(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const defaultMeal = await ownedDefaultMeal(userId, str(formData.get("defaultMealId")));
  const name = str(formData.get("name")) || defaultMeal?.name || "";
  if (!name) return failure("Pick a Default Meal or type a meal name");
  const nutrition = readNutrition(formData);
  const useDefaultNutrition = defaultMeal && nutrition.calories === 0;
  await prisma.mealPlanItem.create({
    data: {
      userId,
      name,
      meal: optStr(formData.get("meal")) ?? defaultMeal?.meal ?? null,
      date: parseDate(formData.get("date")),
      notes: optStr(formData.get("notes")),
      defaultMealId: defaultMeal?.id ?? null,
      ...(useDefaultNutrition
        ? {
            calories: defaultMeal.calories,
            protein: defaultMeal.protein,
            carbs: defaultMeal.carbs,
            fat: defaultMeal.fat,
          }
        : nutrition),
      ingredients: defaultMeal
        ? { create: defaultMeal.items.map((i) => ({ name: i.name, quantity: i.quantity })) }
        : undefined,
    },
  });
  invalidatePlanner(userId);
  return success(`Planned “${name}”`);
}

export async function deletePlanItem(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  const result = await prisma.mealPlanItem.updateMany({
    where: { id, userId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  if (result.count === 0) return failure("Planned meal not found");
  invalidatePlanner(userId);
  return success("Removed from plan");
}

export async function addShoppingItem(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const mealPlanItemId = str(formData.get("mealPlanItemId"));
  const name = str(formData.get("name"));
  if (!name) return failure("Enter an ingredient");
  const owns = await prisma.mealPlanItem.findFirst({
    where: { id: mealPlanItemId, userId },
  });
  if (!owns) return failure("Planned meal not found");
  await prisma.shoppingItem.create({
    data: { mealPlanItemId, name, quantity: optStr(formData.get("quantity")) },
  });
  invalidatePlanner(userId);
  return success(`Added “${name}” to the shopping list`);
}

export async function toggleShoppingItem(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  const toChecked = await prisma.shoppingItem.updateMany({
    where: { id, checked: false, mealPlanItem: { userId } },
    data: { checked: true },
  });
  if (toChecked.count === 0) {
    const toUnchecked = await prisma.shoppingItem.updateMany({
      where: { id, checked: true, mealPlanItem: { userId } },
      data: { checked: false },
    });
    if (toUnchecked.count === 0) return failure("Shopping item not found");
  }
  invalidatePlanner(userId);
  return success();
}
