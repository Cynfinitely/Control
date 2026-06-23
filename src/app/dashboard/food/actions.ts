"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getUserId, str, optStr, num, parseDate } from "@/lib/actions";

export async function logFood(formData: FormData) {
  const userId = await getUserId();
  const name = str(formData.get("name"));
  if (!name) return;
  await prisma.foodLogEntry.create({
    data: {
      userId,
      name,
      meal: str(formData.get("meal")) || "breakfast",
      quantity: optStr(formData.get("quantity")),
      calories: num(formData.get("calories")),
      protein: num(formData.get("protein")),
      carbs: num(formData.get("carbs")),
      fat: num(formData.get("fat")),
      date: parseDate(formData.get("date")),
    },
  });
  revalidatePath("/dashboard/food");
}

export async function deleteFood(formData: FormData) {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  await prisma.foodLogEntry.updateMany({
    where: { id, userId },
    data: { deletedAt: new Date() },
  });
  revalidatePath("/dashboard/food");
}

export async function saveTarget(formData: FormData) {
  const userId = await getUserId();
  const data = {
    calories: num(formData.get("calories"), 2000),
    protein: num(formData.get("protein"), 120),
    carbs: num(formData.get("carbs"), 220),
    fat: num(formData.get("fat"), 70),
  };
  await prisma.nutritionTarget.upsert({
    where: { userId },
    update: data,
    create: { userId, ...data },
  });
  revalidatePath("/dashboard/food");
}

// ---- Meal planner + shopping list ----

export async function addPlanItem(formData: FormData) {
  const userId = await getUserId();
  const name = str(formData.get("name"));
  if (!name) return;
  await prisma.mealPlanItem.create({
    data: {
      userId,
      name,
      meal: str(formData.get("meal")) || "breakfast",
      date: parseDate(formData.get("date")),
      notes: optStr(formData.get("notes")),
    },
  });
  revalidatePath("/dashboard/food/planner");
}

export async function deletePlanItem(formData: FormData) {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  await prisma.mealPlanItem.updateMany({
    where: { id, userId },
    data: { deletedAt: new Date() },
  });
  revalidatePath("/dashboard/food/planner");
}

export async function addShoppingItem(formData: FormData) {
  const userId = await getUserId();
  const mealPlanItemId = str(formData.get("mealPlanItemId"));
  const name = str(formData.get("name"));
  if (!name) return;
  // ensure ownership
  const owns = await prisma.mealPlanItem.findFirst({
    where: { id: mealPlanItemId, userId },
  });
  if (!owns) return;
  await prisma.shoppingItem.create({
    data: { mealPlanItemId, name, quantity: optStr(formData.get("quantity")) },
  });
  revalidatePath("/dashboard/food/planner");
}

export async function toggleShoppingItem(formData: FormData) {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  const item = await prisma.shoppingItem.findFirst({
    where: { id, mealPlanItem: { userId } },
  });
  if (!item) return;
  await prisma.shoppingItem.update({
    where: { id },
    data: { checked: !item.checked },
  });
  revalidatePath("/dashboard/food/planner");
}
