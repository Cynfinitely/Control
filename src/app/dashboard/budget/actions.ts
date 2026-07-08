"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getUserId, str, optStr, parseDate } from "@/lib/actions";
import { revalidateUserCache } from "@/lib/cache";
import { parseAmountToCents } from "@/lib/budget";
import { ensureBudgetCategories } from "@/lib/budget-categories";
import { startOfDay } from "@/lib/date";
import { success, failure, wrapFormAction } from "@/lib/action-result";

function invalidateBudget(userId: string) {
  revalidateUserCache(userId, "dashboard", "budget");
  revalidatePath("/dashboard/budget");
  revalidatePath("/dashboard/budget/categories");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/reports");
  revalidatePath("/dashboard/review");
}

async function getCategoryForUser(userId: string, categoryId: string, kind: string) {
  return prisma.budgetCategory.findFirst({
    where: { id: categoryId, userId, kind, isHidden: false },
  });
}

export async function saveStartingBalance(formData: FormData) {
  const userId = await getUserId();
  const amountCents = parseAmountToCents(formData.get("amount"));
  if (amountCents === null) return;

  const date = parseDate(formData.get("date"));
  await prisma.budgetProfile.upsert({
    where: { userId },
    update: {
      startingBalanceCents: amountCents,
      startingBalanceDate: startOfDay(date),
      setupComplete: true,
    },
    create: {
      userId,
      startingBalanceCents: amountCents,
      startingBalanceDate: startOfDay(date),
      setupComplete: true,
    },
  });
  invalidateBudget(userId);
}

export async function logTransaction(formData: FormData) {
  const userId = await getUserId();
  await ensureBudgetCategories(userId);

  const type = str(formData.get("type"));
  if (type !== "income" && type !== "expense") return failure("Invalid transaction type");

  const amountCents = parseAmountToCents(formData.get("amount"));
  if (amountCents === null) return failure("Enter a valid amount");

  const categoryId = str(formData.get("categoryId"));
  const category = await getCategoryForUser(userId, categoryId, type);
  if (!category) return failure("Select a valid category");

  await prisma.budgetTransaction.create({
    data: {
      userId,
      type,
      amountCents,
      categoryId: category.id,
      date: parseDate(formData.get("date")),
      note: optStr(formData.get("note")),
    },
  });
  invalidateBudget(userId);
  return success("Transaction logged");
}

export const logTransactionForm = wrapFormAction(logTransaction, "Transaction logged");

export async function updateTransaction(formData: FormData) {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  if (!id) return failure("Invalid transaction");

  await ensureBudgetCategories(userId);

  const type = str(formData.get("type"));
  if (type !== "income" && type !== "expense") return failure("Invalid transaction type");

  const amountCents = parseAmountToCents(formData.get("amount"));
  if (amountCents === null) return failure("Enter a valid amount");

  const categoryId = str(formData.get("categoryId"));
  const category = await getCategoryForUser(userId, categoryId, type);
  if (!category) return failure("Select a valid category");

  const result = await prisma.budgetTransaction.updateMany({
    where: { id, userId, deletedAt: null },
    data: {
      type,
      amountCents,
      categoryId: category.id,
      date: parseDate(formData.get("date")),
      note: optStr(formData.get("note")),
    },
  });
  if (result.count === 0) return failure("Transaction not found");

  invalidateBudget(userId);
  return success("Transaction updated");
}

export const updateTransactionForm = wrapFormAction(updateTransaction, "Transaction updated");

export async function deleteTransaction(formData: FormData) {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  await prisma.budgetTransaction.updateMany({
    where: { id, userId },
    data: { deletedAt: new Date() },
  });
  invalidateBudget(userId);
}

export async function addCategory(formData: FormData) {
  const userId = await getUserId();
  const name = str(formData.get("name"));
  const kind = str(formData.get("kind"));
  if (!name || (kind !== "income" && kind !== "expense")) return;

  const slugBase = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const slug = `${slugBase}-${Date.now()}`;

  const maxOrder = await prisma.budgetCategory.aggregate({
    where: { userId, kind },
    _max: { sortOrder: true },
  });

  await prisma.budgetCategory.create({
    data: {
      userId,
      name,
      slug,
      kind,
      sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
      isPreset: false,
    },
  });
  invalidateBudget(userId);
}

export async function renameCategory(formData: FormData) {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  const name = str(formData.get("name"));
  if (!name) return;

  await prisma.budgetCategory.updateMany({
    where: { id, userId },
    data: { name },
  });
  invalidateBudget(userId);
}

export async function toggleCategoryHidden(formData: FormData) {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  const category = await prisma.budgetCategory.findFirst({ where: { id, userId } });
  if (!category) return;

  await prisma.budgetCategory.updateMany({
    where: { id, userId },
    data: { isHidden: !category.isHidden },
  });
  invalidateBudget(userId);
}

export async function moveCategory(formData: FormData) {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  const direction = str(formData.get("direction"));
  if (direction !== "up" && direction !== "down") return;

  const category = await prisma.budgetCategory.findFirst({ where: { id, userId } });
  if (!category) return;

  const siblings = await prisma.budgetCategory.findMany({
    where: { userId, kind: category.kind },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  const index = siblings.findIndex((c) => c.id === id);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= siblings.length) return;

  const other = siblings[swapIndex];
  await prisma.$transaction([
    prisma.budgetCategory.update({
      where: { id: category.id },
      data: { sortOrder: other.sortOrder },
    }),
    prisma.budgetCategory.update({
      where: { id: other.id },
      data: { sortOrder: category.sortOrder },
    }),
  ]);
  invalidateBudget(userId);
}

export async function updateStartingBalance(formData: FormData) {
  return saveStartingBalance(formData);
}
