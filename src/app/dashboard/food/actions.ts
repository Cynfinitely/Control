"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getUserId, str, optStr, num, parseDate } from "@/lib/actions";
import { revalidateUserCache } from "@/lib/cache";

function invalidateFood(userId: string) {
  revalidateUserCache(userId, "dashboard");
  revalidatePath("/dashboard/food");
}

function invalidatePlanner(userId: string) {
  revalidateUserCache(userId, "food-planner");
  revalidatePath("/dashboard/food/planner");
}

export async function logFood(formData: FormData) {
  const userId = await getUserId();
  const name = str(formData.get("name"));
  if (!name) return;
  await prisma.foodLogEntry.create({
    data: {
      userId,
      name,
      meal: str(formData.get("meal")) || "breakfast",
      calories: num(formData.get("calories")),
      date: parseDate(formData.get("date")),
    },
  });
  invalidateFood(userId);
}

export async function deleteFood(formData: FormData) {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  await prisma.foodLogEntry.updateMany({
    where: { id, userId },
    data: { deletedAt: new Date() },
  });
  invalidateFood(userId);
}

export async function saveTarget(formData: FormData) {
  const userId = await getUserId();
  const calories = num(formData.get("calories"), 2000);
  await prisma.nutritionTarget.upsert({
    where: { userId },
    update: { calories },
    create: { userId, calories },
  });
  invalidateFood(userId);
}

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
  invalidatePlanner(userId);
}

export async function deletePlanItem(formData: FormData) {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  await prisma.mealPlanItem.updateMany({
    where: { id, userId },
    data: { deletedAt: new Date() },
  });
  invalidatePlanner(userId);
}

export async function addShoppingItem(formData: FormData) {
  const userId = await getUserId();
  const mealPlanItemId = str(formData.get("mealPlanItemId"));
  const name = str(formData.get("name"));
  if (!name) return;
  const owns = await prisma.mealPlanItem.findFirst({
    where: { id: mealPlanItemId, userId },
  });
  if (!owns) return;
  await prisma.shoppingItem.create({
    data: { mealPlanItemId, name, quantity: optStr(formData.get("quantity")) },
  });
  invalidatePlanner(userId);
}

export async function toggleShoppingItem(formData: FormData) {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  const toChecked = await prisma.shoppingItem.updateMany({
    where: { id, checked: false, mealPlanItem: { userId } },
    data: { checked: true },
  });
  if (toChecked.count === 0) {
    await prisma.shoppingItem.updateMany({
      where: { id, checked: true, mealPlanItem: { userId } },
      data: { checked: false },
    });
  }
  invalidatePlanner(userId);
}
