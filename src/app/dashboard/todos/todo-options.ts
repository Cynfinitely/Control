import {
  ANYTIME_LABEL,
  PRIORITIES,
  TIME_SLOTS,
  type TimeSlot,
} from "@/lib/todo-meta";
import type { PillOption } from "./PillPicker";

/** Work / After work / Anytime ("" = anytime). */
export const SLOT_OPTIONS: PillOption[] = [
  ...(Object.keys(TIME_SLOTS) as TimeSlot[]).map(value => ({
    value,
    label: TIME_SLOTS[value],
  })),
  { value: "", label: ANYTIME_LABEL },
];

export const PRIORITY_OPTIONS: PillOption[] = (
  Object.keys(PRIORITIES) as (keyof typeof PRIORITIES)[]
).map(value => ({ value, label: PRIORITIES[value] }));

export function categoryOptions(categories: readonly string[]): PillOption[] {
  return categories.map(value => ({ value, label: value }));
}
