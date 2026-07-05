"use server";

import { prisma } from "@/lib/db";
import { getUserId, str, parseDate, optStr } from "@/lib/actions";
import { revalidateUserCache } from "@/lib/cache";
import { startOfDay, endOfDay, addDays, toDateInputValue } from "@/lib/date";
import { isValidTimeRange } from "@/lib/plan/time";
import { findOverlappingBlock } from "@/lib/plan/overlap";
import { parsePlanText } from "@/lib/plan/parse-text";
import { getDayPlanBlocks } from "@/lib/queries/plan";

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
    select: { id: true, startTime: true, endTime: true },
  });
}

export async function createPlanBlock(formData: FormData) {
  const userId = await getUserId();
  const title = str(formData.get("title"));
  const startTime = str(formData.get("startTime"));
  const endTime = str(formData.get("endTime"));
  const planDate = startOfDay(parseDate(formData.get("planDate")));
  const kind = str(formData.get("kind")) || "custom";
  const linkType = optStr(formData.get("linkType"));
  const linkId = optStr(formData.get("linkId"));
  const notes = optStr(formData.get("notes"));

  if (!title || !isValidTimeRange(startTime, endTime)) return;

  const existing = await getExistingBlocks(userId, planDate);
  if (findOverlappingBlock(existing, { startTime, endTime })) return;

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
}

export async function updatePlanBlock(formData: FormData) {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  const title = str(formData.get("title"));
  const startTime = str(formData.get("startTime"));
  const endTime = str(formData.get("endTime"));
  const kind = str(formData.get("kind")) || "custom";
  const notes = optStr(formData.get("notes"));

  if (!id || !title || !isValidTimeRange(startTime, endTime)) return;

  const block = await prisma.planBlock.findFirst({
    where: { id, userId, deletedAt: null },
    select: { planDate: true },
  });
  if (!block) return;

  const existing = await getExistingBlocks(userId, block.planDate);
  if (findOverlappingBlock(existing, { startTime, endTime }, id)) return;

  await prisma.planBlock.updateMany({
    where: { id, userId },
    data: { title, startTime, endTime, kind, notes },
  });
  invalidate(userId);
}

export async function togglePlanBlockStatus(formData: FormData) {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  const block = await prisma.planBlock.findFirst({
    where: { id, userId, deletedAt: null },
    select: { status: true, linkType: true, linkId: true },
  });
  if (!block) return;

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
    return;
  } else if (nextStatus === "planned" && block.linkType === "followup" && block.linkId) {
    await prisma.followUp.updateMany({
      where: { id: block.linkId, userId, done: true },
      data: { done: false },
    });
    invalidateNetworking(userId);
    return;
  }

  await prisma.planBlock.updateMany({
    where: { id, userId },
    data: { status: nextStatus },
  });
  invalidate(userId);
}

export async function skipPlanBlock(formData: FormData) {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  await prisma.planBlock.updateMany({
    where: { id, userId, deletedAt: null },
    data: { status: "skipped" },
  });
  invalidate(userId);
}

export async function deletePlanBlock(formData: FormData) {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  await prisma.planBlock.updateMany({
    where: { id, userId },
    data: { deletedAt: new Date() },
  });
  invalidate(userId);
}

export async function acceptPlanSuggestion(formData: FormData) {
  const userId = await getUserId();
  const planDate = startOfDay(parseDate(formData.get("planDate")));
  const title = str(formData.get("title"));
  const startTime = str(formData.get("startTime"));
  const endTime = str(formData.get("endTime"));
  const kind = str(formData.get("kind")) || "custom";
  const linkType = optStr(formData.get("linkType"));
  const linkId = optStr(formData.get("linkId"));
  const suggestionKey = str(formData.get("suggestionKey"));

  if (!title || !isValidTimeRange(startTime, endTime)) return;

  const existing = await getExistingBlocks(userId, planDate);
  if (findOverlappingBlock(existing, { startTime, endTime })) return;

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
}

export async function dismissPlanSuggestion(formData: FormData) {
  const userId = await getUserId();
  const planDate = startOfDay(parseDate(formData.get("planDate")));
  const suggestionKey = str(formData.get("suggestionKey"));
  if (!suggestionKey) return;

  await prisma.planSuggestionDismissal.upsert({
    where: {
      userId_planDate_suggestionKey: { userId, planDate, suggestionKey },
    },
    create: { userId, planDate, suggestionKey },
    update: {},
  });
  invalidate(userId);
}

export async function copyPlanFromDay(formData: FormData) {
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

  if (sourceBlocks.length === 0) return;

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
}

export async function savePlanAsTemplate(formData: FormData) {
  const userId = await getUserId();
  const planDate = startOfDay(parseDate(formData.get("planDate")));
  const name = str(formData.get("name"));
  const dayOfWeekRaw = str(formData.get("dayOfWeek"));
  const isDefault = str(formData.get("isDefault")) === "true";

  if (!name) return;

  const blocks = await getDayPlanBlocks(userId, toDateInputValue(planDate));
  if (blocks.length === 0) return;

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
}

export async function applyPlanTemplate(formData: FormData) {
  const userId = await getUserId();
  const planDate = startOfDay(parseDate(formData.get("planDate")));
  const templateId = str(formData.get("templateId"));
  const replace = str(formData.get("replace")) === "true";

  const template = await prisma.planTemplate.findFirst({
    where: { id: templateId, userId },
    include: { blocks: { orderBy: { sortOrder: "asc" } } },
  });
  if (!template || template.blocks.length === 0) return;

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
}

export async function deletePlanTemplate(formData: FormData) {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  await prisma.planTemplate.deleteMany({ where: { id, userId } });
  invalidate(userId);
}

export async function copyYesterdayPlan(formData: FormData) {
  const userId = await getUserId();
  const planDate = startOfDay(parseDate(formData.get("planDate")));
  const sourceDate = addDays(planDate, -1);
  const fd = new FormData();
  fd.set("planDate", toDateInputValue(planDate));
  fd.set("sourceDate", toDateInputValue(sourceDate));
  fd.set("replace", str(formData.get("replace")) || "false");
  await copyPlanFromDay(fd);
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
  const mode = str(formData.get("mode")) || "replace";

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
