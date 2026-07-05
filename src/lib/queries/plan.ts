import { prisma } from "@/lib/db";
import { cacheTag, cachedQuery } from "@/lib/cache";
import { startOfDay, endOfDay } from "@/lib/date";
import { sortBlocksByTime, blocksOverlap } from "@/lib/plan/overlap";
import { isBlockOverdue, isBlockActive, isBlockUpcoming, parseTimeToMinutes, getCurrentTimeMinutes } from "@/lib/plan/time";
import { toDateInputValue } from "@/lib/date";

export type PlanBlockItem = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  kind: string;
  status: string;
  linkType: string | null;
  linkId: string | null;
  color: string | null;
  notes: string | null;
  sortOrder: number;
};

export type PlanTemplateItem = {
  id: string;
  name: string;
  dayOfWeek: number | null;
  isDefault: boolean;
  blockCount: number;
};

export type PlanDayStats = {
  totalBlocks: number;
  doneBlocks: number;
  skippedBlocks: number;
  completionPct: number;
  hasOverlaps: boolean;
  runningBehindCount: number;
};

const blockSelect = {
  id: true,
  title: true,
  startTime: true,
  endTime: true,
  kind: true,
  status: true,
  linkType: true,
  linkId: true,
  color: true,
  notes: true,
  sortOrder: true,
} as const;

async function syncLinkedBlockStatuses(userId: string, blocks: PlanBlockItem[]): Promise<PlanBlockItem[]> {
  const todoIds = blocks.filter((b) => b.linkType === "todo" && b.linkId).map((b) => b.linkId!);
  const followUpIds = blocks.filter((b) => b.linkType === "followup" && b.linkId).map((b) => b.linkId!);

  const [todos, followUps] = await Promise.all([
    todoIds.length
      ? prisma.todo.findMany({
          where: { userId, id: { in: todoIds }, deletedAt: null },
          select: { id: true, status: true },
        })
      : [],
    followUpIds.length
      ? prisma.followUp.findMany({
          where: { userId, id: { in: followUpIds } },
          select: { id: true, done: true },
        })
      : [],
  ]);

  const todoStatus = new Map(todos.map((t) => [t.id, t.status]));
  const followUpDone = new Map(followUps.map((f) => [f.id, f.done]));

  const updates: { id: string; status: string }[] = [];

  const synced = blocks.map((block) => {
    if (block.status !== "planned") return block;

    if (block.linkType === "todo" && block.linkId) {
      const todo = todoStatus.get(block.linkId);
      if (todo === "done") {
        updates.push({ id: block.id, status: "done" });
        return { ...block, status: "done" };
      }
    }

    if (block.linkType === "followup" && block.linkId) {
      if (followUpDone.get(block.linkId)) {
        updates.push({ id: block.id, status: "done" });
        return { ...block, status: "done" };
      }
    }

    return block;
  });

  if (updates.length > 0) {
    await Promise.all(
      updates.map((u) =>
        prisma.planBlock.updateMany({
          where: { id: u.id, userId, status: "planned" },
          data: { status: u.status },
        })
      )
    );
  }

  return synced;
}

export async function getDayPlanBlocks(userId: string, dayKey: string): Promise<PlanBlockItem[]> {
  const day = new Date(dayKey + "T00:00:00");
  const blocks = await cachedQuery(
    ["plan-day", userId, dayKey],
    [cacheTag("plan", userId)],
    () =>
      prisma.planBlock.findMany({
        where: {
          userId,
          deletedAt: null,
          planDate: { gte: startOfDay(day), lte: endOfDay(day) },
        },
        select: blockSelect,
      })
  );

  const synced = await syncLinkedBlockStatuses(userId, blocks);
  return sortBlocksByTime(synced);
}

export async function getPlanTemplates(userId: string): Promise<PlanTemplateItem[]> {
  return cachedQuery(
    ["plan-templates", userId],
    [cacheTag("plan", userId)],
    async () => {
      const templates = await prisma.planTemplate.findMany({
        where: { userId },
        orderBy: [{ isDefault: "desc" }, { name: "asc" }],
        include: { _count: { select: { blocks: true } } },
      });
      return templates.map((t) => ({
        id: t.id,
        name: t.name,
        dayOfWeek: t.dayOfWeek,
        isDefault: t.isDefault,
        blockCount: t._count.blocks,
      }));
    }
  );
}

export async function getDismissedSuggestionKeys(userId: string, dayKey: string): Promise<string[]> {
  const day = new Date(dayKey + "T00:00:00");
  const rows = await cachedQuery(
    ["plan-dismissals", userId, dayKey],
    [cacheTag("plan", userId)],
    () =>
      prisma.planSuggestionDismissal.findMany({
        where: {
          userId,
          planDate: { gte: startOfDay(day), lte: endOfDay(day) },
        },
        select: { suggestionKey: true },
      })
  );
  return rows.map((r) => r.suggestionKey);
}

export async function getPlanDayStats(userId: string, dayKey: string, now = new Date()): Promise<PlanDayStats> {
  const blocks = await getDayPlanBlocks(userId, dayKey);

  let hasOverlaps = false;
  for (let i = 0; i < blocks.length; i++) {
    for (let j = i + 1; j < blocks.length; j++) {
      if (blocksOverlap(blocks[i], blocks[j])) {
        hasOverlaps = true;
        break;
      }
    }
    if (hasOverlaps) break;
  }

  const doneBlocks = blocks.filter((b) => b.status === "done").length;
  const skippedBlocks = blocks.filter((b) => b.status === "skipped").length;
  const totalBlocks = blocks.length;
  const completionPct = totalBlocks === 0 ? 0 : Math.round((doneBlocks / totalBlocks) * 100);

  const isToday = dayKey === toDateInputValue(now);

  const runningBehindCount = isToday
    ? blocks.filter((b) => isBlockOverdue(b.startTime, b.endTime, b.status, now)).length
    : 0;

  return {
    totalBlocks,
    doneBlocks,
    skippedBlocks,
    completionPct,
    hasOverlaps,
    runningBehindCount,
  };
}

export async function getPlanPreviewBlocks(userId: string, dayKey: string, limit = 5, now = new Date()) {
  const blocks = await getDayPlanBlocks(userId, dayKey);

  const current = blocks.find((b) => isBlockActive(b.startTime, b.endTime, now) && b.status === "planned");
  const upcoming = blocks.filter(
    (b) => b.status === "planned" && isBlockUpcoming(b.startTime, now)
  );

  const preview: PlanBlockItem[] = [];
  if (current) preview.push(current);

  for (const block of upcoming) {
    if (preview.length >= limit) break;
    if (current && block.id === current.id) continue;
    preview.push(block);
  }

  if (preview.length < limit) {
    const remaining = blocks.filter((b) => !preview.some((p) => p.id === b.id));
    for (const block of remaining) {
      if (preview.length >= limit) break;
      preview.push(block);
    }
  }

  preview.sort((a, b) => (parseTimeToMinutes(a.startTime) ?? 0) - (parseTimeToMinutes(b.startTime) ?? 0));

  return {
    blocks: preview.slice(0, limit),
    allBlocks: blocks,
    currentBlockId: current?.id ?? null,
    currentTimeMinutes: getCurrentTimeMinutes(now),
  };
}
