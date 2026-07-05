import { compareTime, parseTimeToMinutes, timelineEndMinutes, timelineStartMinutes } from "@/lib/plan/time";

export type TimeBlock = {
  id: string;
  startTime: string;
  endTime: string;
};

function intervalsOverlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

function blockTimelineInterval(
  block: Pick<TimeBlock, "startTime" | "endTime">,
  dayOffset = 0
): { start: number; end: number } | null {
  const start = timelineStartMinutes(block.startTime, dayOffset);
  const end = timelineEndMinutes(block.startTime, block.endTime, dayOffset);
  if (start === null || end === null) return null;
  return { start, end };
}

export function blocksOverlap(
  a: Pick<TimeBlock, "startTime" | "endTime">,
  b: Pick<TimeBlock, "startTime" | "endTime">
): boolean {
  const aStart = parseTimeToMinutes(a.startTime);
  const aEnd = parseTimeToMinutes(a.endTime);
  const bStart = parseTimeToMinutes(b.startTime);
  const bEnd = parseTimeToMinutes(b.endTime);
  if (aStart === null || aEnd === null || bStart === null || bEnd === null) return false;

  const aInterval = blockTimelineInterval(a, 0);
  const bInterval = blockTimelineInterval(b, 0);
  if (!aInterval || !bInterval) return false;

  if (intervalsOverlap(aInterval.start, aInterval.end, bInterval.start, bInterval.end)) {
    return true;
  }

  // Check if b is on next-day segment (after midnight rollover in schedule)
  const bNextDay = blockTimelineInterval(b, 1);
  if (bNextDay && intervalsOverlap(aInterval.start, aInterval.end, bNextDay.start, bNextDay.end)) {
    return true;
  }

  const aNextDay = blockTimelineInterval(a, 1);
  if (aNextDay && intervalsOverlap(aNextDay.start, aNextDay.end, bInterval.start, bInterval.end)) {
    return true;
  }

  return false;
}

export function findOverlappingBlock(
  blocks: TimeBlock[],
  candidate: Pick<TimeBlock, "startTime" | "endTime">,
  excludeId?: string
): TimeBlock | null {
  for (const block of blocks) {
    if (excludeId && block.id === excludeId) continue;
    if (blocksOverlap(block, candidate)) return block;
  }
  return null;
}

export function sortBlocksByTime<T extends { startTime: string; sortOrder: number }>(blocks: T[]): T[] {
  return [...blocks].sort((a, b) => {
    const byTime = compareTime(a.startTime, b.startTime);
    if (byTime !== 0) return byTime;
    return a.sortOrder - b.sortOrder;
  });
}
