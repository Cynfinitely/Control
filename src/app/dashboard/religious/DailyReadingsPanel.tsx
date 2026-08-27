"use client";

import { readingProgress, sumAmounts } from "@/lib/daily-readings";
import SubmitButton from "@/components/SubmitButton";
import {
  deleteDailyReadingItem,
  logDailyReading,
  saveDailyReadingItem,
  seedSuggestedReadings,
} from "./actions";

type Item = {
  id: string;
  name: string;
  unit: string;
  dailyTarget: number;
  linkKind: string | null;
};

type Entry = {
  itemId: string;
  amount: number;
};

type Props = {
  items: Item[];
  todayEntries: Entry[];
  dayValue: string;
};

function unitLabel(unit: string, count: number) {
  if (unit === "times") return count === 1 ? "time" : "times";
  return count === 1 ? "page" : "pages";
}

export default function DailyReadingsPanel({ items, todayEntries, dayValue }: Props) {
  return (
    <div className="card mb-6">
      <h2 className="section-title">Daily readings</h2>
      <p className="mt-1 text-sm text-slate-500">
        Track a personal set of daily readings. Add, edit, or remove items any time.
      </p>

      {items.length === 0 ? (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-slate-500">
            No readings yet. Start with a suggested set (Quran, Jawshan, Risale-i Nur, Gülen) or add
            your own.
          </p>
          <form action={seedSuggestedReadings}>
            <SubmitButton className="btn-primary touch-target w-full sm:w-auto">
              Add suggested readings
            </SubmitButton>
          </form>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {items.map((item) => {
            const logged = sumAmounts(todayEntries.filter((entry) => entry.itemId === item.id));
            const { pct, done } = readingProgress(logged, item.dailyTarget);
            return (
              <div
                key={item.id}
                className={`rounded-lg border p-3 ${
                  done
                    ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20"
                    : "border-slate-100 dark:border-slate-700"
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-slate-800 dark:text-slate-100">{item.name}</p>
                      {done && <span className="badge bg-emerald-100 text-emerald-700">Done</span>}
                      {item.linkKind === "quran" && (
                        <span className="badge bg-brand-50 text-brand-700">linked to khatm</span>
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-slate-500">
                      {logged}/{item.dailyTarget} {unitLabel(item.unit, item.dailyTarget)}
                    </p>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                      <div className="h-full bg-brand-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <form action={logDailyReading}>
                      <input type="hidden" name="itemId" value={item.id} />
                      <input type="hidden" name="amount" value="1" />
                      <input type="hidden" name="date" value={dayValue} />
                      <SubmitButton className="btn-ghost touch-target text-sm">+1</SubmitButton>
                    </form>
                    <form action={logDailyReading}>
                      <input type="hidden" name="itemId" value={item.id} />
                      <input type="hidden" name="amount" value={item.dailyTarget} />
                      <input type="hidden" name="date" value={dayValue} />
                      <SubmitButton className="btn-primary touch-target text-sm">
                        +{item.dailyTarget}
                      </SubmitButton>
                    </form>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <details className="mt-4">
        <summary className="cursor-pointer text-sm font-medium text-brand-700">Manage readings</summary>
        <form action={saveDailyReadingItem} className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-4">
          <input name="name" className="input sm:col-span-2" placeholder="Name" required />
          <input
            name="dailyTarget"
            type="number"
            min={1}
            defaultValue={5}
            className="input"
            aria-label="Daily target"
          />
          <select name="unit" className="input" defaultValue="pages" aria-label="Unit">
            <option value="pages">pages</option>
            <option value="times">times</option>
          </select>
          <div className="sm:col-span-4">
            <SubmitButton className="btn-ghost touch-target">Add reading</SubmitButton>
          </div>
        </form>

        {items.map((item) => (
          <div
            key={item.id}
            className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:items-end dark:border-slate-700"
          >
            <form action={saveDailyReadingItem} className="grid min-w-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-3">
              <input type="hidden" name="id" value={item.id} />
              <input name="name" className="input" defaultValue={item.name} required />
              <input
                name="dailyTarget"
                type="number"
                min={1}
                defaultValue={item.dailyTarget}
                className="input"
                aria-label={`${item.name} target`}
              />
              {item.linkKind === "quran" ? (
                <>
                  <input type="hidden" name="unit" value="pages" />
                  <p className="input flex items-center text-slate-500">pages</p>
                </>
              ) : (
                <select name="unit" className="input" defaultValue={item.unit}>
                  <option value="pages">pages</option>
                  <option value="times">times</option>
                </select>
              )}
              <div className="sm:col-span-3">
                <SubmitButton className="btn-ghost touch-target text-sm">Save</SubmitButton>
              </div>
            </form>
            <form action={deleteDailyReadingItem}>
              <input type="hidden" name="id" value={item.id} />
              <SubmitButton className="btn-ghost touch-target text-sm text-red-600">Remove</SubmitButton>
            </form>
          </div>
        ))}
      </details>
    </div>
  );
}
