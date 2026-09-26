import type { FoodEntryView } from "@/lib/queries/food";

export type DiaryEntry = FoodEntryView & {
  /** "HH:MM" in the user's timezone; null for legacy entries without a time. */
  timeLabel: string | null;
};
