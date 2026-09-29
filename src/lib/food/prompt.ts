import { coerceDate, toDateInputValue } from "@/lib/date";

export type FoodPromptTargets = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type FoodPromptDay = {
  date: Date | string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  waterGlasses: number;
  logged: boolean;
};

export type FoodPromptEntry = {
  date: Date | string;
  name: string;
  meal: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type FoodRangePromptSnapshot = {
  label: string;
  from: Date | string;
  to: Date | string;
  targets: FoodPromptTargets;
  days: FoodPromptDay[];
  entries: FoodPromptEntry[];
};

function grams(value: number): string {
  return `${Math.round(value)}g`;
}

export function buildFoodRangePrompt(snapshot: FoodRangePromptSnapshot): string {
  const lines: string[] = [
    "You are a nutrition coach. Analyze this food log and suggest concrete improvements.",
    "",
    "Constraints:",
    "- Use only the meals, totals, and dates below",
    "- Do not invent meals or days",
    "- Targets are daily goals",
    "",
    "Please provide:",
    "1. A short snapshot of the period",
    "2. Days over or under the calorie or protein target",
    "3. Protein consistency",
    "4. Missing days",
    "5. A few concrete changes",
    "",
    "## Range",
    snapshot.label,
    "",
    "## Daily targets",
    `- Calories: ${Math.round(snapshot.targets.calories)} kcal`,
    `- Protein: ${grams(snapshot.targets.protein)}`,
    `- Carbs: ${grams(snapshot.targets.carbs)}`,
    `- Fat: ${grams(snapshot.targets.fat)}`,
    "",
    "## Daily totals",
  ];

  const days = [...snapshot.days].sort(
    (a, b) => coerceDate(a.date).getTime() - coerceDate(b.date).getTime()
  );
  if (days.length === 0) {
    lines.push("- None");
  } else {
    for (const day of days) {
      const key = toDateInputValue(day.date);
      if (!day.logged) {
        lines.push(`${key} | no food logged | water ${day.waterGlasses}`);
      } else {
        lines.push(
          `${key} | ${Math.round(day.calories)} kcal | P ${grams(day.protein)} | C ${grams(day.carbs)} | F ${grams(day.fat)} | water ${day.waterGlasses}`
        );
      }
    }
  }

  lines.push("", "## Meals");
  const entries = [...snapshot.entries].sort(
    (a, b) => coerceDate(a.date).getTime() - coerceDate(b.date).getTime()
  );
  if (entries.length === 0) {
    lines.push("- None");
  } else {
    for (const entry of entries) {
      lines.push(
        `${toDateInputValue(entry.date)} | ${entry.meal} | ${entry.name} | ${Math.round(entry.calories)} kcal | P ${Math.round(entry.protein)} C ${Math.round(entry.carbs)} F ${Math.round(entry.fat)}`
      );
    }
  }

  return lines.join("\n");
}
