import { prisma } from "@/lib/db";

const PRESET_EXPENSE = [
  { slug: "housing", name: "Housing", icon: "home", sortOrder: 0 },
  { slug: "food", name: "Food", icon: "food", sortOrder: 1 },
  { slug: "transport", name: "Transport", icon: "briefcase", sortOrder: 2 },
  { slug: "shopping", name: "Shopping", icon: "plus", sortOrder: 3 },
  { slug: "health", name: "Health", icon: "target", sortOrder: 4 },
  { slug: "entertainment", name: "Entertainment", icon: "chart", sortOrder: 5 },
  { slug: "subscriptions", name: "Subscriptions", icon: "settings", sortOrder: 6 },
  { slug: "other-expense", name: "Other", icon: "plus", sortOrder: 7 },
] as const;

const PRESET_INCOME = [
  { slug: "salary", name: "Salary", icon: "briefcase", sortOrder: 0 },
  { slug: "freelance", name: "Freelance", icon: "users", sortOrder: 1 },
  { slug: "investment", name: "Investment", icon: "chart", sortOrder: 2 },
  { slug: "gift", name: "Gift", icon: "target", sortOrder: 3 },
  { slug: "other-income", name: "Other", icon: "plus", sortOrder: 4 },
] as const;

export async function ensureBudgetCategories(userId: string) {
  const count = await prisma.budgetCategory.count({ where: { userId } });
  if (count > 0) return;

  await prisma.budgetCategory.createMany({
    data: [
      ...PRESET_EXPENSE.map((c) => ({
        userId,
        slug: c.slug,
        name: c.name,
        kind: "expense",
        icon: c.icon,
        sortOrder: c.sortOrder,
        isPreset: true,
      })),
      ...PRESET_INCOME.map((c) => ({
        userId,
        slug: c.slug,
        name: c.name,
        kind: "income",
        icon: c.icon,
        sortOrder: c.sortOrder,
        isPreset: true,
      })),
    ],
  });
}
