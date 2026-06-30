import { prisma } from "@/lib/db";
import { getPeriodKey, type GoalPeriod } from "@/lib/period";
import { revalidateUserCache } from "@/lib/cache";

export type GoalLinkType = "workout" | "learning" | "quran";

/** Auto-increment numeric goals linked to a module action. */
export async function incrementLinkedGoals(
  userId: string,
  linkType: GoalLinkType,
  refDate = new Date(),
  amount = 1
) {
  const periods: GoalPeriod[] = ["weekly", "monthly", "yearly"];
  const periodKeys = periods.map((p) => ({ period: p, periodKey: getPeriodKey(p, refDate) }));
  let updated = false;

  for (const { period, periodKey } of periodKeys) {
    const goals = await prisma.goal.findMany({
      where: {
        userId,
        deletedAt: null,
        status: "active",
        type: "numeric",
        linkType,
        period,
        periodKey,
      },
    });

    for (const goal of goals) {
      updated = true;
      const next = goal.currentValue + amount;
      await prisma.goal.update({
        where: { id: goal.id },
        data: {
          currentValue: next,
          status: next >= (goal.targetValue ?? 1) ? "completed" : "active",
        },
      });
      await prisma.goalCheckIn.create({
        data: { goalId: goal.id, value: amount, note: `Auto: ${linkType}` },
      });
    }
  }

  if (updated) {
    revalidateUserCache(userId, "goals", "dashboard");
  }
}
