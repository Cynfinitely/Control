/**
 * The app's switchable feature areas. This list drives the sidebar, the
 * command palette, the module picker in Settings and onboarding, and every
 * place that has to hide a module the user turned off.
 *
 * Module ids are persisted in User.disabledModules — never rename them.
 * Home, Settings and Admin are always available and are not listed here.
 */
export const MODULE_SECTIONS = ["Today", "Track", "Grow", "Reflect"] as const;
export type ModuleSection = (typeof MODULE_SECTIONS)[number];

export const MODULES = [
  { id: "plan", section: "Today", label: "Plan", icon: "clipboard", href: "/dashboard/plan", description: "Time-block your day, reuse day templates and get suggestions from your other modules." },
  { id: "calendar", section: "Today", label: "Calendar", icon: "calendar", href: "/dashboard/calendar", description: "Events, repeating events and reminders with notifications." },
  { id: "todos", section: "Today", label: "Todos", icon: "check", href: "/dashboard/todos", description: "A daily checklist with priorities, due dates and a backlog." },
  { id: "work", section: "Today", label: "Work", icon: "briefcase", href: "/dashboard/work", description: "A short list of today's work focus items and a daily work log." },
  { id: "journal", section: "Today", label: "Journal", icon: "book", href: "/dashboard/journal", description: "One entry per day: mood, wins, blockers and notes." },
  { id: "weather", section: "Today", label: "Weather", icon: "cloud-sun", href: "/dashboard/weather", description: "Current conditions and hourly and weekly forecasts for your location." },
  { id: "food", section: "Track", label: "Food", icon: "food", href: "/dashboard/food", description: "Food diary, water, default meals, a weekly meal planner and a shopping list." },
  { id: "budget", section: "Track", label: "Budget", icon: "wallet", href: "/dashboard/budget", description: "Import Nordea bank statements, categorize spending and see monthly totals." },
  { id: "exercise", section: "Track", label: "Exercise", icon: "dumbbell", href: "/dashboard/exercise", description: "Workout programs, gym sets, runs and walks, body weight and measurements." },
  { id: "religious", section: "Track", label: "Religious", icon: "moon", href: "/dashboard/religious", description: "Daily prayers, qaza, Quran reading, daily readings, dhikr and fasting." },
  { id: "migraine", section: "Track", label: "Migraine", icon: "heart", href: "/dashboard/health/migraine", description: "A monthly calendar of migraine days with pain level, duration and notes." },
  { id: "goals", section: "Grow", label: "Goals", icon: "target", href: "/dashboard/goals", description: "Weekly, monthly and yearly goals with counters, milestones and auto-tracking." },
  { id: "career", section: "Grow", label: "Career", icon: "briefcase", href: "/dashboard/career", description: "Career goals, skills, certifications, work history, learning and job applications." },
  { id: "networking", section: "Grow", label: "Networking", icon: "users", href: "/dashboard/networking", description: "People you want to stay in touch with, a log of interactions and insights." },
  { id: "principles", section: "Reflect", label: "Principles", icon: "shield", href: "/dashboard/principles", description: "Your personal principles, with a daily reminder to re-read them." },
  { id: "inspirations", section: "Reflect", label: "Inspirations", icon: "sparkles", href: "/dashboard/inspirations", description: "A library of quotes and notes; one is shown on Home each visit." },
  { id: "priorities", section: "Reflect", label: "Priorities", icon: "flag", href: "/dashboard/priorities", description: "The ranked order of what matters most in your life." },
  { id: "review", section: "Reflect", label: "Review", icon: "clipboard", href: "/dashboard/review", description: "A guided weekly review across the modules you use." },
  { id: "reports", section: "Reflect", label: "Reports", icon: "chart", href: "/dashboard/reports", description: "Daily, weekly and monthly numbers across the modules you use." },
] as const satisfies readonly {
  id: string;
  section: ModuleSection;
  label: string;
  icon: string;
  href: string;
  description: string;
}[];

export type ModuleId = (typeof MODULES)[number]["id"];
export type ModuleDefinition = (typeof MODULES)[number];

export const MODULE_IDS: readonly ModuleId[] = MODULES.map((m) => m.id);

export function isModuleId(value: unknown): value is ModuleId {
  return typeof value === "string" && (MODULE_IDS as readonly string[]).includes(value);
}

/** "budget,weather" → ["budget","weather"]; unknown ids, blanks and duplicates are dropped. */
export function parseDisabledModules(csv: string | null | undefined): ModuleId[] {
  if (!csv) return [];
  const seen = new Set<string>(csv.split(",").map((raw) => raw.trim()));
  return MODULE_IDS.filter((id) => seen.has(id));
}

/** Stable CSV in registry order, without duplicates or unknown ids. */
export function serializeDisabledModules(ids: Iterable<string>): string {
  const set = new Set<string>(ids);
  return MODULE_IDS.filter((id) => set.has(id)).join(",");
}

export type ModuleFilter = {
  /** True when the module is switched on. */
  has: (id: ModuleId) => boolean;
  /** Keeps items that belong to no module or to one that is switched on. */
  keep: <T extends { module?: ModuleId }>(items: readonly T[]) => T[];
};

export function moduleFilter(disabled: readonly ModuleId[]): ModuleFilter {
  const off = new Set<ModuleId>(disabled);
  const has = (id: ModuleId) => !off.has(id);
  return { has, keep: (items) => items.filter((item) => !item.module || has(item.module)) };
}

/** The module a dashboard path belongs to, or null for Home, Settings and Admin. */
export function moduleForPath(pathname: string): ModuleId | null {
  const path = pathname.split("?")[0];
  // The longest matching href wins, so nested routes resolve to their own module.
  const match = [...MODULES]
    .sort((a, b) => b.href.length - a.href.length)
    .find((m) => path === m.href || path.startsWith(`${m.href}/`));
  if (match) return match.id;
  return path === "/dashboard/health" ? "migraine" : null;
}
