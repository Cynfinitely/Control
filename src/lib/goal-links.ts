import { prisma } from "@/lib/db";
import { getPeriodKey, type GoalPeriod } from "@/lib/period";
import { revalidateUserCache } from "@/lib/cache";

export type GoalLinkType = "workout" | "learning" | "quran";

const autoNote = (linkType: GoalLinkType) => `Auto: ${linkType}`;

/** Auto-increment numeric goals linked to a module action. */
export async function incrementLinkedGoals(
  userId: string,
  linkType: GoalLinkType,
  refDate = new Date(),
  amount = 1
) {
  // Nothing to count (e.g. a learning entry logged with 0 hours).
  if (!(amount > 0)) return;
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
        data: { goalId: goal.id, value: amount, note: autoNote(linkType) },
      });
    }
  }

  if (updated) {
    revalidateUserCache(userId, "goals", "dashboard");
  }
}

/**
 * Reverse incrementLinkedGoals when the activity is deleted. Only takes back
 * what an automatic check-in of the same amount put there, so a goal created
 * after the activity, or one already corrected by hand, is left alone.
 */
export async function decrementLinkedGoals(
  userId: string,
  linkType: GoalLinkType,
  refDate: Date,
  amount = 1
) {
  if (!(amount > 0)) return;
  const periods: GoalPeriod[] = ["weekly", "monthly", "yearly"];
  let updated = false;

  for (const period of periods) {
    const goals = await prisma.goal.findMany({
      where: {
        userId,
        deletedAt: null,
        type: "numeric",
        linkType,
        period,
        periodKey: getPeriodKey(period, new Date(refDate)),
      },
    });

    for (const goal of goals) {
      const checkIn = await prisma.goalCheckIn.findFirst({
        where: { goalId: goal.id, note: autoNote(linkType), value: amount },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        select: { id: true },
      });
      if (!checkIn) continue;

      updated = true;
      const next = Math.max(0, goal.currentValue - amount);
      await prisma.goalCheckIn.delete({ where: { id: checkIn.id } });
      await prisma.goal.update({
        where: { id: goal.id },
        data: {
          currentValue: next,
          // Undo an auto-complete when the goal drops back below its target.
          ...(goal.status === "completed" && next < (goal.targetValue ?? 1) ? { status: "active" } : {}),
        },
      });
    }
  }

  if (updated) {
    revalidateUserCache(userId, "goals", "dashboard");
  }
}
