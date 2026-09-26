export const FOOD_MODES = ["observe", "stabilize", "optimize"] as const;
export type FoodMode = (typeof FOOD_MODES)[number];

export const FOOD_MODE_INFO: Record<FoodMode, { label: string; description: string }> = {
  observe: {
    label: "Observe",
    description: "Log what you eat with as little friction as possible. No targets, no numbers.",
  },
  stabilize: {
    label: "Stabilize",
    description: "Spot meals you repeat and turn the useful ones into one-tap Default Meals.",
  },
  optimize: {
    label: "Optimize",
    description: "Bring calories and macros forward once your eating routine is steady.",
  },
};

export const DEFAULT_MEAL_LABELS = ["Meal 1", "Meal 2", "Snack"];

export const MEAL_LABEL_PRESETS: { id: string; label: string; labels: string[] }[] = [
  { id: "flexible", label: "Meal 1 / Meal 2 / Snack", labels: DEFAULT_MEAL_LABELS },
  { id: "classic", label: "Breakfast / Lunch / Dinner / Snack", labels: ["Breakfast", "Lunch", "Dinner", "Snack"] },
];

const MAX_MEAL_LABELS = 8;
const MAX_LABEL_LENGTH = 40;

export type FoodSettings = {
  mode: FoodMode;
  mealLabels: string[];
};

export function parseFoodMode(value: string | null | undefined): FoodMode {
  return FOOD_MODES.find((m) => m === value) ?? "observe";
}

export function parseMealLabels(raw: string | null | undefined): string[] {
  if (!raw) return [...DEFAULT_MEAL_LABELS];
  const seen = new Set<string>();
  const labels: string[] = [];
  for (const part of raw.split(/\r?\n|,/)) {
    const label = part.trim().slice(0, MAX_LABEL_LENGTH);
    const key = label.toLowerCase();
    if (!label || seen.has(key)) continue;
    seen.add(key);
    labels.push(label);
    if (labels.length === MAX_MEAL_LABELS) break;
  }
  return labels.length > 0 ? labels : [...DEFAULT_MEAL_LABELS];
}

export function serializeMealLabels(labels: string[]): string {
  return parseMealLabels(labels.join("\n")).join("\n");
}

export function resolveFoodSettings(row: { mode: string; mealLabels: string } | null): FoodSettings {
  return {
    mode: parseFoodMode(row?.mode),
    mealLabels: parseMealLabels(row?.mealLabels),
  };
}

const LEGACY_MEALS: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

export function displayMealLabel(meal: string | null | undefined): string | null {
  if (!meal) return null;
  return LEGACY_MEALS[meal] ?? meal;
}

export function isSnack(meal: string | null | undefined): boolean {
  return Boolean(meal && /snack/i.test(meal));
}

export type NutritionValues = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export function hasNutrition(n: NutritionValues): boolean {
  return n.calories > 0 || n.protein > 0 || n.carbs > 0 || n.fat > 0;
}
