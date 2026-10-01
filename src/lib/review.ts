/**
 * Guided weekly review: step definitions and the CSV state stored in
 * WeeklyReview.completedSteps. Step ids are persisted — never rename them.
 */
export const REVIEW_STEPS = [
  {
    id: "inbox",
    title: "Clear todos & backlog",
    description: "Move unfinished todos from previous days into the backlog, then skim what's waiting.",
  },
  {
    id: "goals",
    title: "Check weekly goals",
    description: "Tick off what you finished and log any progress you haven't counted yet.",
  },
  {
    id: "prayers",
    title: "Spiritual catch-up",
    description: "See what qaza is still waiting and plan when to make it up.",
  },
  {
    id: "spending",
    title: "Review spending",
    description: "Look at what you spent this week and categorize anything new.",
  },
  {
    id: "people",
    title: "Relationships",
    description: "Reach out to people you haven't spoken to in a while.",
  },
  {
    id: "plan-ahead",
    title: "Plan the week ahead",
    description: "Block time for tomorrow, check the meal plan and shopping, and write a few lines.",
  },
] as const;

export type ReviewStepId = (typeof REVIEW_STEPS)[number]["id"];

const STEP_IDS: readonly string[] = REVIEW_STEPS.map((s) => s.id);

export function isReviewStepId(value: unknown): value is ReviewStepId {
  return typeof value === "string" && STEP_IDS.includes(value);
}

/** "inbox,goals" → Set{"inbox","goals"}; unknown ids and blanks are dropped. */
export function parseCompletedSteps(csv: string | null | undefined): Set<ReviewStepId> {
  const result = new Set<ReviewStepId>();
  if (!csv) return result;
  for (const raw of csv.split(",")) {
    const id = raw.trim();
    if (isReviewStepId(id)) result.add(id);
  }
  return result;
}

/** Stable CSV in step order, without duplicates or unknown ids. */
export function serializeCompletedSteps(steps: Iterable<string>): string {
  const set = new Set<string>(steps);
  return REVIEW_STEPS.filter((s) => set.has(s.id))
    .map((s) => s.id)
    .join(",");
}

/** Set (done=true), clear (done=false) or flip (done omitted) one step; returns the new CSV. */
export function toggleCompletedStep(csv: string | null | undefined, step: ReviewStepId, done?: boolean): string {
  const set = parseCompletedSteps(csv);
  const next = done ?? !set.has(step);
  if (next) set.add(step);
  else set.delete(step);
  return serializeCompletedSteps(set);
}

export function reviewProgress(completed: Iterable<string>): { done: number; total: number } {
  const set = new Set<string>(completed);
  const done = REVIEW_STEPS.filter((s) => set.has(s.id)).length;
  return { done, total: REVIEW_STEPS.length };
}

/** True when every step is checked off. */
export function isReviewComplete(completed: Iterable<string> | string | null | undefined): boolean {
  const set = typeof completed === "string" || completed == null ? parseCompletedSteps(completed) : new Set(completed);
  return REVIEW_STEPS.every((s) => set.has(s.id));
}

/** Validates a client-supplied week key like "2026-W40". */
export function isWeekKey(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-W\d{2}$/.test(value);
}
