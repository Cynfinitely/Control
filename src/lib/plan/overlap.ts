import { compareTime, parseTimeToMinutes } from "@/lib/plan/time";

export type TimeBlock = {
  id: string;
  startTime: string;
  endTime: string;
};

export function blocksOverlap(a: Pick<TimeBlock, "startTime" | "endTime">, b: Pick<TimeBlock, "startTime" | "endTime">): boolean {
  const aStart = parseTimeToMinutes(a.startTime);
  const aEnd = parseTimeToMinutes(a.endTime);
  const bStart = parseTimeToMinutes(b.startTime);
  const bEnd = parseTimeToMinutes(b.endTime);
  if (aStart === null || aEnd === null || bStart === null || bEnd === null) return false;
  return aStart < bEnd && bStart < aEnd;
}

export function findOverlappingBlock(blocks: TimeBlock[], candidate: Pick<TimeBlock, "startTime" | "endTime">, excludeId?: string): TimeBlock | null {
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
