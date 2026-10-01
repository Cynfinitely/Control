"use server";

import { prisma } from "@/lib/db";
import { getUserId, str, parseDate, optStr } from "@/lib/actions";
import { revalidateUserCache } from "@/lib/cache";
import { startOfDay, endOfDay, addDays, toDateInputValue } from "@/lib/date";
import { isValidTimeRange } from "@/lib/plan/time";
import { findOverlappingBlock } from "@/lib/plan/overlap";
import { parsePlanText } from "@/lib/plan/parse-text";
import { getDayPlanBlocks } from "@/lib/queries/plan";
import { success, failure, type ActionResult } from "@/lib/action-result";

const INVALID_RANGE = "End time must be after the start time (blocks can be up to 12 hours).";

function overlapMessage(block: { title: string; startTime: string; endTime: string }) {
  return `That time overlaps “${block.title}” (${block.startTime}–${block.endTime}). Pick another time.`;
}

function invalidate(userId: string) {
  revalidateUserCache(userId, "plan", "dashboard", "todos");
}

function invalidateNetworking(userId: string) {
  revalidateUserCache(userId, "plan", "dashboard", "networking");
}

async function getExistingBlocks(userId: string, dayDate: Date) {
  return prisma.planBlock.findMany({
    where: {
      userId,
      deletedAt: null,
      planDate: { gte: startOfDay(dayDate), lte: endOfDay(dayDate) },
    },
    select: { id: true, title: true, startTime: true, endTime: true },
  });
}

async function findOverlap(userId: string, dayDate: Date, candidate: { startTime: string; endTime: string }, excludeId?: string) {
  const existing = await getExistingBlocks(userId, dayDate);
  const hit = findOverlappingBlock(existing, candidate, excludeId);
  return hit ? existing.find((b) => b.id === hit.id) ?? null : null;
}

export async function createPlanBlock(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const title = str(formData.get("title"));
  const startTime = str(formData.get("startTime"));
  const endTime = str(formData.get("endTime"));
  const planDate = startOfDay(parseDate(formData.get("planDate")));
  const kind = str(formData.get("kind")) || "custom";
  const linkType = optStr(formData.get("linkType"));
  const linkId = optStr(formData.get("linkId"));
  const notes = optStr(formData.get("notes"));

  if (!title) return failure("Give the block a title.");
  if (!isValidTimeRange(startTime, endTime)) return failure(INVALID_RANGE);

  const overlap = await findOverlap(userId, planDate, { startTime, endTime });
  if (overlap) return failure(overlapMessage(overlap));

  const maxOrder = await prisma.planBlock.aggregate({
    where: { userId, deletedAt: null, planDate: { gte: startOfDay(planDate), lte: endOfDay(planDate) } },
    _max: { sortOrder: true },
  });

  await prisma.planBlock.create({
    data: {
      userId,
      planDate,
      title,
      startTime,
      endTime,
      kind,
      linkType,
      linkId,
      notes,
      sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
    },
  });
  invalidate(userId);
  return success("Block added");
}

export async function updatePlanBlock(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  const title = str(formData.get("title"));
  const startTime = str(formData.get("startTime"));
  const endTime = str(formData.get("endTime"));
  const kind = str(formData.get("kind")) || "custom";
  const notes = optStr(formData.get("notes"));

  if (!id) return failure("Block not found.");
  if (!title) return failure("Give the block a title.");
  if (!isValidTimeRange(startTime, endTime)) return failure(INVALID_RANGE);

  const block = await prisma.planBlock.findFirst({
    where: { id, userId, deletedAt: null },
    select: { planDate: true },
  });
  if (!block) return failure("Block not found — it may have been deleted.");

  const overlap = await findOverlap(userId, block.planDate, { startTime, endTime }, id);
  if (overlap) return failure(overlapMessage(overlap));

  await prisma.planBlock.updateMany({
    where: { id, userId },
    data: { title, startTime, endTime, kind, notes },
  });
  invalidate(userId);
  return success("Block updated");
}

export async function togglePlanBlockStatus(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  const block = await prisma.planBlock.findFirst({
    where: { id, userId, deletedAt: null },
    select: { status: true, linkType: true, linkId: true },
  });
  if (!block) return failure("Block not found — it may have been deleted.");

  const nextStatus = block.status === "done" ? "planned" : "done";

  if (nextStatus === "done" && block.linkType === "todo" && block.linkId) {
    await prisma.todo.updateMany({
      where: { id: block.linkId, userId, status: "open" },
      data: { status: "done", completedAt: new Date() },
    });
  } else if (nextStatus === "planned" && block.linkType === "todo" && block.linkId) {
    await prisma.todo.updateMany({
      where: { id: block.linkId, userId, status: "done" },
      data: { status: "open", completedAt: null },
    });
  }

  if (nextStatus === "done" && block.linkType === "followup" && block.linkId) {
    await prisma.followUp.updateMany({
      where: { id: block.linkId, userId, done: false },
      data: { done: true },
    });
    invalidateNetworking(userId);
  } else if (nextStatus === "planned" && block.linkType === "followup" && block.linkId) {
    await prisma.followUp.updateMany({
      where: { id: block.linkId, userId, done: true },
      data: { done: false },
    });
    invalidateNetworking(userId);
  }

  await prisma.planBlock.updateMany({
    where: { id, userId },
    data: { status: nextStatus },
  });
  invalidate(userId);
  return success();
}

export async function skipPlanBlock(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  await prisma.planBlock.updateMany({
    where: { id, userId, deletedAt: null },
    data: { status: "skipped" },
  });
  invalidate(userId);
  return success("Block skipped");
}

export async function deletePlanBlock(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  await prisma.planBlock.updateMany({
    where: { id, userId },
    data: { deletedAt: new Date() },
  });
  invalidate(userId);
  return success("Block deleted");
}

export async function acceptPlanSuggestion(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const planDate = startOfDay(parseDate(formData.get("planDate")));
  const title = str(formData.get("title"));
  const startTime = str(formData.get("startTime"));
  const endTime = str(formData.get("endTime"));
  const kind = str(formData.get("kind")) || "custom";
  const linkType = optStr(formData.get("linkType"));
  const linkId = optStr(formData.get("linkId"));
  const suggestionKey = str(formData.get("suggestionKey"));

  if (!title || !isValidTimeRange(startTime, endTime)) return failure("This suggestion is no longer valid.");

  const overlap = await findOverlap(userId, planDate, { startTime, endTime });
  if (overlap) return failure(overlapMessage(overlap));

  const maxOrder = await prisma.planBlock.aggregate({
    where: { userId, deletedAt: null, planDate: { gte: startOfDay(planDate), lte: endOfDay(planDate) } },
    _max: { sortOrder: true },
  });

  await prisma.planBlock.create({
    data: {
      userId,
      planDate,
      title,
      startTime,
      endTime,
      kind,
      linkType,
      linkId,
      sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
    },
  });

  if (suggestionKey) {
    await prisma.planSuggestionDismissal.upsert({
      where: {
        userId_planDate_suggestionKey: {
          userId,
          planDate,
          suggestionKey,
        },
      },
      create: { userId, planDate, suggestionKey },
      update: {},
    });
  }

  invalidate(userId);
  return success(`Added “${title}”`);
}

export async function dismissPlanSuggestion(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const planDate = startOfDay(parseDate(formData.get("planDate")));
  const suggestionKey = str(formData.get("suggestionKey"));
  if (!suggestionKey) return failure("This suggestion is no longer valid.");

  await prisma.planSuggestionDismissal.upsert({
    where: {
      userId_planDate_suggestionKey: { userId, planDate, suggestionKey },
    },
    create: { userId, planDate, suggestionKey },
    update: {},
  });
  invalidate(userId);
  return success("Suggestion dismissed");
}

export async function copyPlanFromDay(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const targetDate = startOfDay(parseDate(formData.get("planDate")));
  const sourceDate = startOfDay(parseDate(formData.get("sourceDate")));
  const replace = str(formData.get("replace")) === "true";

  const sourceBlocks = await prisma.planBlock.findMany({
    where: {
      userId,
      deletedAt: null,
      planDate: { gte: startOfDay(sourceDate), lte: endOfDay(sourceDate) },
    },
    orderBy: [{ sortOrder: "asc" }, { startTime: "asc" }],
  });

  if (sourceBlocks.length === 0) return failure("Nothing to copy — that day has no blocks.");

  if (replace) {
    await prisma.planBlock.updateMany({
      where: {
        userId,
        deletedAt: null,
        planDate: { gte: startOfDay(targetDate), lte: endOfDay(targetDate) },
      },
      data: { deletedAt: new Date() },
    });
  }

  await prisma.planBlock.createMany({
    data: sourceBlocks.map((b, i) => ({
      userId,
      planDate: targetDate,
      title: b.title,
      startTime: b.startTime,
      endTime: b.endTime,
      kind: b.kind,
      status: "planned",
      linkType: b.linkType,
      linkId: b.linkId,
      color: b.color,
      notes: b.notes,
      sortOrder: i,
    })),
  });
  invalidate(userId);
  return success(`Copied ${sourceBlocks.length} block${sourceBlocks.length === 1 ? "" : "s"}`);
}

export async function savePlanAsTemplate(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const planDate = startOfDay(parseDate(formData.get("planDate")));
  const name = str(formData.get("name"));
  const dayOfWeekRaw = str(formData.get("dayOfWeek"));
  const isDefault = str(formData.get("isDefault")) === "true";

  if (!name) return failure("Give the template a name.");

  const blocks = await getDayPlanBlocks(userId, toDateInputValue(planDate));
  if (blocks.length === 0) return failure("Add some blocks before saving a template.");

  const dayOfWeek = dayOfWeekRaw === "" ? null : Number(dayOfWeekRaw);

  if (isDefault && dayOfWeek !== null && !Number.isNaN(dayOfWeek)) {
    await prisma.planTemplate.updateMany({
      where: { userId, dayOfWeek, isDefault: true },
      data: { isDefault: false },
    });
  }

  const template = await prisma.planTemplate.create({
    data: {
      userId,
      name,
      dayOfWeek: Number.isNaN(dayOfWeek) ? null : dayOfWeek,
      isDefault,
    },
  });

  await prisma.planTemplateBlock.createMany({
    data: blocks.map((b, i) => ({
      templateId: template.id,
      title: b.title,
      startTime: b.startTime,
      endTime: b.endTime,
      kind: b.kind,
      linkType: b.linkType,
      color: b.color,
      sortOrder: i,
    })),
  });
  invalidate(userId);
  return success(`Template “${name}” saved`);
}

export async function applyPlanTemplate(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const planDate = startOfDay(parseDate(formData.get("planDate")));
  const templateId = str(formData.get("templateId"));
  const replace = str(formData.get("replace")) === "true";

  const template = await prisma.planTemplate.findFirst({
    where: { id: templateId, userId },
    include: { blocks: { orderBy: { sortOrder: "asc" } } },
  });
  if (!template) return failure("Template not found.");
  if (template.blocks.length === 0) return failure("That template has no blocks.");

  if (replace) {
    await prisma.planBlock.updateMany({
      where: {
        userId,
        deletedAt: null,
        planDate: { gte: startOfDay(planDate), lte: endOfDay(planDate) },
      },
      data: { deletedAt: new Date() },
    });
  }

  await prisma.planBlock.createMany({
    data: template.blocks.map((b, i) => ({
      userId,
      planDate,
      title: b.title,
      startTime: b.startTime,
      endTime: b.endTime,
      kind: b.kind,
      status: "planned",
      linkType: b.linkType,
      color: b.color,
      sortOrder: i,
    })),
  });
  invalidate(userId);
  return success(replace ? `Day replaced with “${template.name}”` : `Applied “${template.name}”`);
}

export async function deletePlanTemplate(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  const result = await prisma.planTemplate.deleteMany({ where: { id, userId } });
  if (result.count === 0) return failure("Template not found.");
  invalidate(userId);
  return success("Template deleted");
}

export async function copyYesterdayPlan(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const planDate = startOfDay(parseDate(formData.get("planDate")));
  const sourceDate = addDays(planDate, -1);
  const fd = new FormData();
  fd.set("planDate", toDateInputValue(planDate));
  fd.set("sourceDate", toDateInputValue(sourceDate));
  fd.set("replace", str(formData.get("replace")) || "false");
  const result = await copyPlanFromDay(fd);
  if (!result.ok) return failure("Nothing to copy — the previous day has no blocks.");
  return result;
}

export type ImportPlanFromTextResult = {
  imported: number;
  skipped: number;
  warnings: string[];
};

export async function importPlanFromText(formData: FormData): Promise<ImportPlanFromTextResult> {
  const userId = await getUserId();
  const planDate = startOfDay(parseDate(formData.get("planDate")));
  const text = str(formData.get("text"));
  const mode = str(formData.get("mode")) === "replace" ? "replace" : "merge";

  const empty: ImportPlanFromTextResult = { imported: 0, skipped: 0, warnings: [] };
  if (!text) return empty;

  const { entries, warnings } = parsePlanText(text);
  if (entries.length === 0) {
    return { imported: 0, skipped: 0, warnings };
  }

  if (mode === "replace") {
    await prisma.planBlock.updateMany({
      where: {
        userId,
        deletedAt: null,
        planDate: { gte: startOfDay(planDate), lte: endOfDay(planDate) },
      },
      data: { deletedAt: new Date() },
    });
  }

  const existing =
    mode === "merge" ? await getExistingBlocks(userId, planDate) : [];

  let skipped = 0;
  const toCreate: {
    userId: string;
    planDate: Date;
    title: string;
    startTime: string;
    endTime: string;
    kind: string;
    status: string;
    sortOrder: number;
  }[] = [];

  const maxOrder =
    mode === "merge"
      ? (
          await prisma.planBlock.aggregate({
            where: {
              userId,
              deletedAt: null,
              planDate: { gte: startOfDay(planDate), lte: endOfDay(planDate) },
            },
            _max: { sortOrder: true },
          })
        )._max.sortOrder ?? -1
      : -1;

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (mode === "merge" && findOverlappingBlock(existing, entry)) {
      skipped += 1;
      continue;
    }

    toCreate.push({
      userId,
      planDate,
      title: entry.title,
      startTime: entry.startTime,
      endTime: entry.endTime,
      kind: entry.kind,
      status: "planned",
      sortOrder: maxOrder + 1 + toCreate.length,
    });

    if (mode === "merge") {
      existing.push({
        id: `import-${i}`,
        title: entry.title,
        startTime: entry.startTime,
        endTime: entry.endTime,
      });
    }
  }

  if (toCreate.length > 0) {
    await prisma.planBlock.createMany({ data: toCreate });
  }

  invalidate(userId);
  return { imported: toCreate.length, skipped, warnings };
}
