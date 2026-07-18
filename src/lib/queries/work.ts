import { prisma } from "@/lib/db";
import { cacheTag, cachedQuery } from "@/lib/cache";
import { startOfDay } from "@/lib/date";

export type WorkFocusItemRow = {
  id: string;
  title: string;
  status: string;
  sortOrder: number;
  notes: string | null;
  linkType: string | null;
  linkId: string | null;
  linkLabel: string | null;
};

export type WorkDayView = {
  id: string | null;
  logNote: string | null;
  focusItems: WorkFocusItemRow[];
};

export type WorkLinkOption = {
  value: string;
  label: string;
};

async function resolveLinkLabels(
  userId: string,
  items: {
    id: string;
    title: string;
    status: string;
    sortOrder: number;
    notes: string | null;
    linkType: string | null;
    linkId: string | null;
  }[]
): Promise<WorkFocusItemRow[]> {
  const goalIds = items
    .filter((i) => i.linkType === "career_goal" && i.linkId)
    .map((i) => i.linkId as string);
  const skillIds = items
    .filter((i) => i.linkType === "skill" && i.linkId)
    .map((i) => i.linkId as string);

  const [goals, skills] = await Promise.all([
    goalIds.length
      ? prisma.careerGoal.findMany({
          where: { userId, id: { in: goalIds }, deletedAt: null },
          select: { id: true, title: true },
        })
      : Promise.resolve([]),
    skillIds.length
      ? prisma.skill.findMany({
          where: { userId, id: { in: skillIds }, deletedAt: null },
          select: { id: true, name: true },
        })
      : Promise.resolve([]),
  ]);

  const goalMap = new Map(goals.map((g) => [g.id, g.title]));
  const skillMap = new Map(skills.map((s) => [s.id, s.name]));

  return items.map((item) => {
    let linkLabel: string | null = null;
    if (item.linkType === "career_goal" && item.linkId) {
      linkLabel = goalMap.get(item.linkId) ?? null;
    } else if (item.linkType === "skill" && item.linkId) {
      linkLabel = skillMap.get(item.linkId) ?? null;
    }
    return { ...item, linkLabel };
  });
}

export async function getWorkDay(userId: string, dayKey: string): Promise<WorkDayView> {
  const date = startOfDay(new Date(dayKey + "T00:00:00"));
  return cachedQuery(
    ["work-day", userId, dayKey],
    [cacheTag("work", userId), cacheTag("career", userId)],
    async () => {
      const day = await prisma.workDay.findUnique({
        where: { userId_date: { userId, date } },
        select: {
          id: true,
          logNote: true,
          focusItems: {
            where: { deletedAt: null },
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
            select: {
              id: true,
              title: true,
              status: true,
              sortOrder: true,
              notes: true,
              linkType: true,
              linkId: true,
            },
          },
        },
      });

      if (!day) {
        return { id: null, logNote: null, focusItems: [] };
      }

      const focusItems = await resolveLinkLabels(userId, day.focusItems);
      return { id: day.id, logNote: day.logNote, focusItems };
    }
  );
}

export async function getWorkLinkOptions(userId: string): Promise<{
  goals: WorkLinkOption[];
  skills: WorkLinkOption[];
}> {
  return cachedQuery(["work-links", userId], [cacheTag("work", userId), cacheTag("career", userId)], async () => {
    const [goals, skills] = await Promise.all([
      prisma.careerGoal.findMany({
        where: { userId, deletedAt: null, status: "active" },
        orderBy: { title: "asc" },
        select: { id: true, title: true },
      }),
      prisma.skill.findMany({
        where: { userId, deletedAt: null },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
    ]);

    return {
      goals: goals.map((g) => ({ value: `career_goal:${g.id}`, label: `Goal: ${g.title}` })),
      skills: skills.map((s) => ({ value: `skill:${s.id}`, label: `Skill: ${s.name}` })),
    };
  });
}
