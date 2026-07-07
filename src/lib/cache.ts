import { revalidateTag, unstable_cache } from "next/cache";

export function cacheTag(scope: string, userId: string) {
  return `${scope}:${userId}`;
}

export function revalidateUserCache(userId: string, ...scopes: string[]) {
  for (const scope of scopes) {
    revalidateTag(cacheTag(scope, userId));
  }
}

/**
 * Wraps unstable_cache. Note: cached values are JSON-serialized, so Date fields
 * come back as ISO strings on cache hits. Revive dates after await (see coerceDate).
 */
export function cachedQuery<T>(
  keyParts: string[],
  tags: string[],
  fn: () => Promise<T>
): Promise<T> {
  return unstable_cache(fn, keyParts, { tags })();
}
