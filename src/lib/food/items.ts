const MAX_ITEMS = 30;

/** Splits free-text meal components ("rye bread, turkey; skyr") into trimmed, de-duplicated items. */
export function splitItems(text: string | null | undefined): string[] {
  if (!text) return [];
  const seen = new Set<string>();
  const items: string[] = [];
  for (const part of text.split(/[,;\n]/)) {
    const item = part.trim().replace(/\s+/g, " ");
    const key = normalizeFood(item);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    items.push(item);
    if (items.length === MAX_ITEMS) break;
  }
  return items;
}

export function joinItems(items: string[]): string {
  return items.join(", ");
}

export function normalizeFood(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}
