export type PlanKind =
  | "custom"
  | "todo"
  | "meal"
  | "prayer"
  | "workout"
  | "followup"
  | "break";

export const PLAN_KIND_LABELS: Record<PlanKind, string> = {
  custom: "Custom",
  todo: "Todo",
  meal: "Meal",
  prayer: "Prayer",
  workout: "Workout",
  followup: "Follow-up",
  break: "Break",
};

export const PLAN_KIND_COLORS: Record<PlanKind, string> = {
  custom: "bg-slate-100 border-slate-300 text-slate-800 dark:bg-slate-700 dark:border-slate-500 dark:text-slate-100",
  todo: "bg-blue-50 border-blue-300 text-blue-900 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-200",
  meal: "bg-orange-50 border-orange-300 text-orange-900 dark:bg-orange-950 dark:border-orange-800 dark:text-orange-200",
  prayer: "bg-emerald-50 border-emerald-300 text-emerald-900 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-200",
  workout: "bg-violet-50 border-violet-300 text-violet-900 dark:bg-violet-950 dark:border-violet-800 dark:text-violet-200",
  followup: "bg-amber-50 border-amber-300 text-amber-900 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-200",
  break: "bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-400",
};

export const PLAN_KIND_LINKS: Partial<Record<PlanKind, string>> = {
  todo: "/dashboard/todos",
  meal: "/dashboard/food",
  prayer: "/dashboard/religious",
  workout: "/dashboard/exercise",
  followup: "/dashboard/networking",
};

export function kindColor(kind: string, customColor?: string | null): string {
  if (customColor) return customColor;
  return PLAN_KIND_COLORS[kind as PlanKind] ?? PLAN_KIND_COLORS.custom;
}
