export const MAX_LIFE_PRIORITIES = 12;

export type RankedItem = {
  id: string;
  sortOrder: number;
};

export function neighborForMove(
  items: RankedItem[],
  id: string,
  direction: "up" | "down"
): RankedItem | null {
  const sorted = [...items].sort((a, b) => a.sortOrder - b.sortOrder);
  const index = sorted.findIndex((item) => item.id === id);
  if (index === -1) return null;
  const neighborIndex = direction === "up" ? index - 1 : index + 1;
  return sorted[neighborIndex] ?? null;
}
