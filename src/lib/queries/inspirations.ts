import { prisma } from "@/lib/db";
import { cacheTag, cachedQuery } from "@/lib/cache";

export type InspirationItem = {
  id: string;
  text: string;
  author: string | null;
};

export async function getInspirations(userId: string): Promise<InspirationItem[]> {
  return cachedQuery(
    ["inspirations", userId],
    [cacheTag("inspirations", userId)],
    () =>
      prisma.inspiration.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: { id: true, text: true, author: true },
      })
  );
}
