"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getUserId, str, optStr, parseDate } from "@/lib/actions";
import { revalidateUserCache } from "@/lib/cache";
import { parseAmountToCents } from "@/lib/budget";
import { ensureBudgetCategories } from "@/lib/budget-categories";
import { parseNordeaCsv, NordeaParseError } from "@/lib/budget/nordea-csv";
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

async function markBudgetSetupComplete(userId: string) {
  await prisma.budgetProfile.upsert({
    where: { userId },
    update: { setupComplete: true },
    create: { userId, setupComplete: true },
  });
}

export type ImportBudgetResult = {
  ok: true;
  batchId: string;
  imported: number;
  skippedDuplicates: number;
  autoCategorized: number;
  uncategorized: number;
  message: string;
};

export async function importNordeaFile(
  formData: FormData
): Promise<ImportBudgetResult | { ok: false; error: string }> {
  const userId = await getUserId();
  await ensureBudgetCategories(userId);

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choose a Nordea CSV or TXT file to import" };
  }

  const filename = file.name || "nordea-export.txt";
  let content: string;
  try {
    content = await file.text();
  } catch {
    return { ok: false, error: "Could not read the uploaded file" };
  }

  let parsed;
  try {
    parsed = parseNordeaCsv(content);
  } catch (err) {
    if (err instanceof NordeaParseError) return { ok: false, error: err.message };
    return { ok: false, error: "Failed to parse the Nordea file" };
  }

  const fingerprints = parsed.transactions.map((t) => t.fingerprint);
  const existing = await prisma.budgetTransaction.findMany({
    where: { userId, importFingerprint: { in: fingerprints } },
    select: { id: true, importFingerprint: true, deletedAt: true },
  });
  const existingByFp = new Map(
    existing
      .filter((e) => e.importFingerprint)
      .map((e) => [e.importFingerprint as string, e])
  );

  const rules = await prisma.budgetCategoryRule.findMany({
    where: { userId },
    select: { merchantKey: true, categoryId: true },
  });
  const ruleMap = new Map(rules.map((r) => [r.merchantKey, r.categoryId]));

  const toCreate: typeof parsed.transactions = [];
  const toRestore: { id: string; tx: (typeof parsed.transactions)[0] }[] = [];
  let skippedDuplicates = 0;

  for (const tx of parsed.transactions) {
    const hit = existingByFp.get(tx.fingerprint);
    if (hit && !hit.deletedAt) {
      skippedDuplicates++;
      continue;
    }
    if (hit && hit.deletedAt) {
      toRestore.push({ id: hit.id, tx });
      continue;
    }
    toCreate.push(tx);
  }

  const dates = parsed.transactions.map((t) => t.date.getTime());
  const dateFrom = new Date(Math.min(...dates));
  const dateTo = new Date(Math.max(...dates));

  const batch = await prisma.budgetImportBatch.create({
    data: {
      userId,
      filename,
      rowCount: 0,
      skippedDuplicates,
      dateFrom,
      dateTo,
    },
  });

  const resolveCategory = (merchantKey: string) => ruleMap.get(merchantKey) ?? null;
  const autoCategorized =
    toCreate.filter((tx) => resolveCategory(tx.merchantKey)).length +
    toRestore.filter(({ tx }) => resolveCategory(tx.merchantKey)).length;

  await prisma.$transaction(async (txClient) => {
    for (const { id, tx } of toRestore) {
      await txClient.budgetTransaction.update({
        where: { id },
        data: {
          deletedAt: null,
          type: tx.type,
          amountCents: tx.amountCents,
          date: tx.date,
          note: tx.rawDescription,
          merchantKey: tx.merchantKey,
          rawDescription: tx.rawDescription,
          importFingerprint: tx.fingerprint,
          importBatchId: batch.id,
          categoryId: resolveCategory(tx.merchantKey),
        },
      });
    }

    if (toCreate.length > 0) {
      await txClient.budgetTransaction.createMany({
        data: toCreate.map((tx) => ({
          userId,
          type: tx.type,
          amountCents: tx.amountCents,
          categoryId: resolveCategory(tx.merchantKey),
          date: tx.date,
          note: tx.rawDescription,
          merchantKey: tx.merchantKey,
          rawDescription: tx.rawDescription,
          importFingerprint: tx.fingerprint,
          importBatchId: batch.id,
        })),
      });
    }

    const imported = toCreate.length + toRestore.length;
    await txClient.budgetImportBatch.update({
      where: { id: batch.id },
      data: { rowCount: imported, skippedDuplicates },
    });
  });

  const imported = toCreate.length + toRestore.length;
  const uncategorized = await prisma.budgetTransaction.count({
    where: { userId, deletedAt: null, categoryId: null },
  });

  await markBudgetSetupComplete(userId);
  invalidateBudget(userId);

  return {
    ok: true,
    batchId: batch.id,
    imported,
    skippedDuplicates,
    autoCategorized,
    uncategorized,
    message: `Imported ${imported} · skipped ${skippedDuplicates} duplicates · ${autoCategorized} auto-categorized`,
  };
}

export async function categorizeTransaction(formData: FormData) {
  const userId = await getUserId();
  await ensureBudgetCategories(userId);

  const id = str(formData.get("id"));
  const categoryId = str(formData.get("categoryId"));
  if (!id || !categoryId) return failure("Select a category");

  const tx = await prisma.budgetTransaction.findFirst({
    where: { id, userId, deletedAt: null },
  });
  if (!tx) return failure("Transaction not found");

  const category = await getCategoryForUser(userId, categoryId, tx.type);
  if (!category) return failure("Select a valid category");

  await prisma.budgetTransaction.update({
    where: { id },
    data: { categoryId: category.id },
  });

  if (tx.merchantKey) {
    await prisma.budgetCategoryRule.upsert({
      where: { userId_merchantKey: { userId, merchantKey: tx.merchantKey } },
      update: { categoryId: category.id },
      create: { userId, merchantKey: tx.merchantKey, categoryId: category.id },
    });
  }

  invalidateBudget(userId);
  return success("Category saved");
}

export const categorizeTransactionForm = wrapFormAction(categorizeTransaction, "Category saved");

export async function categorizeTransactionsBulk(formData: FormData) {
  const userId = await getUserId();
  await ensureBudgetCategories(userId);

  const categoryId = str(formData.get("categoryId"));
  const ids = formData.getAll("ids").map((v) => String(v)).filter(Boolean);
  if (!categoryId || ids.length === 0) return failure("Select transactions and a category");

  const txs = await prisma.budgetTransaction.findMany({
    where: { userId, id: { in: ids }, deletedAt: null },
  });
  if (txs.length === 0) return failure("No transactions found");

  const kinds = new Set(txs.map((t) => t.type));
  if (kinds.size !== 1) return failure("Select only income or only expense rows for bulk categorize");

  const kind = txs[0].type;
  const category = await getCategoryForUser(userId, categoryId, kind);
  if (!category) return failure("Select a valid category");

  await prisma.budgetTransaction.updateMany({
    where: { userId, id: { in: txs.map((t) => t.id) }, deletedAt: null },
    data: { categoryId: category.id },
  });

  const merchantKeys = [...new Set(txs.map((t) => t.merchantKey).filter(Boolean))] as string[];
  for (const merchantKey of merchantKeys) {
    await prisma.budgetCategoryRule.upsert({
      where: { userId_merchantKey: { userId, merchantKey } },
      update: { categoryId: category.id },
      create: { userId, merchantKey, categoryId: category.id },
    });
  }

  invalidateBudget(userId);
  return success(`Categorized ${txs.length} transactions`);
}

export const categorizeTransactionsBulkForm = wrapFormAction(
  categorizeTransactionsBulk,
  "Categories saved"
);

export async function undoImportBatch(formData: FormData) {
  const userId = await getUserId();
  const batchId = str(formData.get("batchId"));
  if (!batchId) return failure("Invalid import");

  const batch = await prisma.budgetImportBatch.findFirst({
    where: { id: batchId, userId, deletedAt: null },
  });
  if (!batch) return failure("Import batch not found");

  await prisma.$transaction([
    prisma.budgetTransaction.updateMany({
      where: { userId, importBatchId: batchId, deletedAt: null },
      data: { deletedAt: new Date() },
    }),
    prisma.budgetImportBatch.update({
      where: { id: batchId },
      data: { deletedAt: new Date() },
    }),
  ]);

  invalidateBudget(userId);
  return success("Import undone");
}

export const undoImportBatchForm = wrapFormAction(undoImportBatch, "Import undone");

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

  const existing = await prisma.budgetTransaction.findFirst({
    where: { id, userId, deletedAt: null },
  });
  if (!existing) return failure("Transaction not found");

  await prisma.budgetTransaction.update({
    where: { id },
    data: {
      type,
      amountCents,
      categoryId: category.id,
      date: parseDate(formData.get("date")),
      note: optStr(formData.get("note")),
    },
  });

  if (existing.merchantKey) {
    await prisma.budgetCategoryRule.upsert({
      where: {
        userId_merchantKey: { userId, merchantKey: existing.merchantKey },
      },
      update: { categoryId: category.id },
      create: {
        userId,
        merchantKey: existing.merchantKey,
        categoryId: category.id,
      },
    });
  }

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
