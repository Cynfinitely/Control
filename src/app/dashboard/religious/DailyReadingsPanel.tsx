"use client";

import clsx from "clsx";
import { readingProgress, sumAmounts } from "@/lib/daily-readings";
import ActionForm from "@/components/ActionForm";
import CollapsibleSection from "@/components/CollapsibleSection";
import EmptyState from "@/components/EmptyState";
import Icon from "@/components/Icon";
import SubmitButton from "@/components/SubmitButton";
import SubmitIconButton from "@/components/SubmitIconButton";
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
    <section className="card mb-6" aria-labelledby="readings-title">
      <div className="flex items-center gap-2">
        <h2 id="readings-title" className="section-title">
          Daily readings
        </h2>
        <span className="badge-brand">Today</span>
      </div>
      <p className="mt-1 text-sm text-muted">
        Track a personal set of daily readings. Add, edit, or remove items any time.
      </p>

      {items.length === 0 ? (
        <EmptyState
          variant="inline"
          icon="book"
          headingLevel="h3"
          title="No readings yet"
          description="Start with a suggested set (Quran, Jawshan, Risale-i Nur, Gülen) or add your own under Manage readings."
          className="mt-4"
        >
          <ActionForm action={seedSuggestedReadings}>
            <SubmitButton className="btn-primary touch-target w-full sm:w-auto">Add suggested readings</SubmitButton>
          </ActionForm>
        </EmptyState>
      ) : (
        <ul className="mt-4 space-y-3">
          {items.map((item) => {
            const logged = sumAmounts(todayEntries.filter((entry) => entry.itemId === item.id));
            const { pct, done } = readingProgress(logged, item.dailyTarget);
            return (
              <li
                key={item.id}
                className={clsx(
                  "rounded-lg border p-3",
                  done
                    ? "border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20"
                    : "border-slate-200 dark:border-slate-700"
                )}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-medium text-slate-800 dark:text-slate-100">{item.name}</h3>
                      {done && (
                        <span className="badge-success">
                          <Icon name="check" className="h-3.5 w-3.5" />
                          Done
                        </span>
                      )}
                      {item.linkKind === "quran" && <span className="badge-brand">Linked to khatm</span>}
                    </div>
                    <p className="mt-0.5 text-sm text-muted">
                      {logged}/{item.dailyTarget} {unitLabel(item.unit, item.dailyTarget)}
                    </p>
                    <div
                      className="mt-2 h-1.5 w-full overflow-hidden rounded-full progress-track"
                      role="progressbar"
                      aria-label={`${item.name} today`}
                      aria-valuenow={pct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div className={clsx("h-full", done ? "bg-green-500" : "bg-brand-500")} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <ActionForm action={logDailyReading}>
                      <input type="hidden" name="itemId" value={item.id} />
                      <input type="hidden" name="amount" value="1" />
                      <input type="hidden" name="date" value={dayValue} />
                      <SubmitButton className="btn-ghost touch-target" aria-label={`Log 1 ${unitLabel(item.unit, 1)} of ${item.name}`}>
                        +1
                      </SubmitButton>
                    </ActionForm>
                    {item.dailyTarget > 1 && (
                      <ActionForm action={logDailyReading}>
                        <input type="hidden" name="itemId" value={item.id} />
                        <input type="hidden" name="amount" value={item.dailyTarget} />
                        <input type="hidden" name="date" value={dayValue} />
                        <SubmitButton
                          className="btn-primary touch-target"
                          aria-label={`Log ${item.dailyTarget} ${unitLabel(item.unit, item.dailyTarget)} of ${item.name}`}
                        >
                          +{item.dailyTarget}
                        </SubmitButton>
                      </ActionForm>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <CollapsibleSection title="Manage readings" className="mt-4">
        <ActionForm
          action={saveDailyReadingItem}
          resetOnSuccess
          className="grid grid-cols-2 gap-2 sm:grid-cols-[minmax(0,1fr)_6rem_7rem_auto] sm:items-end"
        >
          <div className="col-span-2 sm:col-span-1">
            <label className="label" htmlFor="reading-new-name">
              Name
            </label>
            <input id="reading-new-name" name="name" className="input" required />
          </div>
          <div>
            <label className="label" htmlFor="reading-new-target">
              Per day
            </label>
            <input
              id="reading-new-target"
              name="dailyTarget"
              type="number"
              min={1}
              defaultValue={5}
              inputMode="numeric"
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="reading-new-unit">
              Unit
            </label>
            <select id="reading-new-unit" name="unit" className="input" defaultValue="pages">
              <option value="pages">pages</option>
              <option value="times">times</option>
            </select>
          </div>
          <SubmitButton className="btn-ghost touch-target col-span-2 sm:col-span-1">Add reading</SubmitButton>
        </ActionForm>

        {items.length > 0 && (
          <ul className="mt-4 divide-y divide-slate-100 border-t border-slate-100 dark:divide-slate-700 dark:border-slate-700">
            {items.map((item) => (
              <li key={item.id} className="flex items-end gap-2 py-3">
                <ActionForm
                  action={saveDailyReadingItem}
                  className="grid min-w-0 flex-1 grid-cols-2 gap-2 sm:grid-cols-[minmax(0,1fr)_6rem_7rem_auto] sm:items-end"
                >
                  <input type="hidden" name="id" value={item.id} />
                  <div className="col-span-2 sm:col-span-1">
                    <label className="sr-only" htmlFor={`reading-${item.id}-name`}>
                      Name
                    </label>
                    <input id={`reading-${item.id}-name`} name="name" className="input" defaultValue={item.name} required />
                  </div>
                  <div>
                    <label className="sr-only" htmlFor={`reading-${item.id}-target`}>
                      {item.name} per day
                    </label>
                    <input
                      id={`reading-${item.id}-target`}
                      name="dailyTarget"
                      type="number"
                      min={1}
                      defaultValue={item.dailyTarget}
                      inputMode="numeric"
                      className="input"
                    />
                  </div>
                  {item.linkKind === "quran" ? (
                    <>
                      <input type="hidden" name="unit" value="pages" />
                      <p className="input flex items-center text-muted" title="Linked to khatm: always pages">
                        pages
                      </p>
                    </>
                  ) : (
                    <div>
                      <label className="sr-only" htmlFor={`reading-${item.id}-unit`}>
                        {item.name} unit
                      </label>
                      <select id={`reading-${item.id}-unit`} name="unit" className="input" defaultValue={item.unit}>
                        <option value="pages">pages</option>
                        <option value="times">times</option>
                      </select>
                    </div>
                  )}
                  <SubmitButton className="btn-ghost touch-target col-span-2 sm:col-span-1" aria-label={`Save ${item.name}`}>
                    Save
                  </SubmitButton>
                </ActionForm>
                <ActionForm
                  action={deleteDailyReadingItem}
                  confirm={{
                    title: `Remove “${item.name}”?`,
                    message: "The reading and everything logged for it will be deleted.",
                    confirmLabel: "Remove",
                  }}
                >
                  <input type="hidden" name="id" value={item.id} />
                  <SubmitIconButton
                    className="btn-icon-danger"
                    aria-label={`Remove ${item.name}`}
                    icon={<Icon name="trash" className="h-4 w-4" />}
                  />
                </ActionForm>
              </li>
            ))}
          </ul>
        )}
      </CollapsibleSection>
    </section>
  );
}
