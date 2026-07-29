import { prisma } from "@/lib/db";
import { cacheTag, cachedQuery, revalidateUserCache } from "@/lib/cache";
import { startOfDay } from "@/lib/date";
import { DEFAULT_PRINCIPLES } from "@/lib/principles/seed";

export type PrincipleItem = {
  id: string;
  text: string;
  category: string;
  sortOrder: number;
};

/** Seed default principles once if the user has none (including archived). */
export async function ensurePrinciplesSeeded(userId: string): Promise<void> {
  const count = await prisma.principle.count({ where: { userId } });
  if (count > 0) return;

  await prisma.principle.createMany({
    data: DEFAULT_PRINCIPLES.map((p) => ({
      userId,
      text: p.text,
      category: p.category,
      sortOrder: p.sortOrder,
    })),
  });
  revalidateUserCache(userId, "principles");
}

export async function getActivePrinciples(userId: string): Promise<PrincipleItem[]> {
  await ensurePrinciplesSeeded(userId);

  return cachedQuery(
    ["principles", userId],
    [cacheTag("principles", userId)],
    () =>
      prisma.principle.findMany({
        where: { userId, archivedAt: null },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: { id: true, text: true, category: true, sortOrder: true },
      })
  );
}

export async function getPrincipleReviewedToday(
  userId: string,
  day: Date = new Date()
): Promise<boolean> {
  const date = startOfDay(day);
  const review = await cachedQuery(
    ["principle-review", userId, date.toISOString()],
    [cacheTag("principles", userId)],
    () =>
      prisma.principleReview.findUnique({
        where: { userId_date: { userId, date } },
        select: { id: true },
      })
  );
  return Boolean(review);
}
