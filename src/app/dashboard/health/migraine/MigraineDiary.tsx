"use client";

import { useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import MonthNavigator from "@/components/MonthNavigator";
import CollapsibleSection from "@/components/CollapsibleSection";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useToast } from "@/components/Toast";
import { monthGridDays } from "@/lib/calendar/format";
import { toDateInputValue } from "@/lib/date";
import {
  DURATION_PRESETS,
  monthMigraineStats,
  painToneClass,
} from "@/lib/health/pain";
import type { MigraineDayLog } from "@/lib/queries/migraine";
import { clearMigraineLog, saveMigraineLog } from "./actions";

type LogEntry = {
  pain: number;
  durationMin: number | null;
  note: string | null;
};

type LogMap = Record<string, LogEntry>;

type OptimisticUpdate = { date: string; entry: LogEntry | null };

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const PAIN_GROUPS: { label: string; values: number[] }[] = [
  { label: "Mild", values: [1, 2, 3] },
  { label: "Moderate", values: [4, 5, 6] },
  { label: "Severe", values: [7, 8, 9, 10] },
];

function toLogMap(logs: MigraineDayLog[]): LogMap {
  return Object.fromEntries(
    logs.map((log) => [log.date, { pain: log.pain, durationMin: log.durationMin, note: log.note }])
  );
}

function applyOptimistic(current: LogMap, update: OptimisticUpdate): LogMap {
  if (update.entry === null) {
    const next = { ...current };
    delete next[update.date];
    return next;
  }
  return {
    ...current,
    [update.date]: { ...current[update.date], ...update.entry },
  };
}

function formatAveragePain(averagePain: number, migraineDays: number): string {
  if (migraineDays === 0) return "—";
  return averagePain.toFixed(1).replace(/\.0$/, "");
}

export default function MigraineDiary({
  monthKey,
  monthLabel,
  todayKey,
  selectedDay,
  selectedLabel,
  logs,
}: {
  monthKey: string;
  monthLabel: string;
  todayKey: string;
  selectedDay: string | null;
  selectedLabel: string;
  logs: MigraineDayLog[];
}) {
  const router = useRouter();
  const { error } = useToast();
  const [pending, startTransition] = useTransition();
  const [logMap, setOptimistic] = useOptimistic(toLogMap(logs), applyOptimistic);
  const [noteDraft, setNoteDraft] = useState(() => {
    const initial = selectedDay ? toLogMap(logs)[selectedDay]?.note ?? "" : "";
    return initial;
  });
  const [noteDay, setNoteDay] = useState(selectedDay);
  const [confirmClear, setConfirmClear] = useState(false);

  if (noteDay !== selectedDay) {
    setNoteDay(selectedDay);
    setNoteDraft(selectedDay ? logMap[selectedDay]?.note ?? "" : "");
  }

  const [year, month] = monthKey.split("-").map(Number);
  const days = monthGridDays(monthKey);
  const stats = monthMigraineStats(Object.values(logMap));
  const selected = selectedDay ? logMap[selectedDay] : undefined;
  const isFutureSelected = Boolean(selectedDay && selectedDay > todayKey);
  const canEdit = Boolean(selectedDay) && !isFutureSelected;
  const moreOpen = Boolean(selected?.durationMin || selected?.note);

  function selectDay(day: Date) {
    const key = toDateInputValue(day);
    if (key > todayKey) return;
    const params = new URLSearchParams({ month: monthKey, day: key });
    router.push(`/dashboard/health/migraine?${params.toString()}`);
  }

  function runSave(date: string, entry: LogEntry, fd: FormData) {
    startTransition(async () => {
      setOptimistic({ date, entry });
      const result = await saveMigraineLog(fd);
      if (!result.ok) {
        error(result.error);
        router.refresh();
      }
    });
  }

  function handlePain(pain: number) {
    if (!selectedDay || !canEdit) return;
    const fd = new FormData();
    fd.set("date", selectedDay);
    fd.set("pain", String(pain));
    runSave(
      selectedDay,
      { pain, durationMin: selected?.durationMin ?? null, note: selected?.note ?? null },
      fd
    );
  }

  function handleDuration(minutes: number) {
    if (!selectedDay || !canEdit || !selected) return;
    const fd = new FormData();
    fd.set("date", selectedDay);
    fd.set("durationMin", String(minutes));
    runSave(selectedDay, { ...selected, durationMin: minutes }, fd);
  }

  function handleNoteSave() {
    if (!selectedDay || !canEdit || !selected) return;
    const fd = new FormData();
    fd.set("date", selectedDay);
    fd.set("note", noteDraft);
    runSave(selectedDay, { ...selected, note: noteDraft.trim() === "" ? null : noteDraft.trim() }, fd);
  }

  function handleClear() {
    if (!selectedDay || !canEdit || !selected) return;
    const fd = new FormData();
    fd.set("date", selectedDay);
    startTransition(async () => {
      setOptimistic({ date: selectedDay, entry: null });
      setNoteDraft("");
      const result = await clearMigraineLog(fd);
      if (!result.ok) {
        error(result.error);
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Migraine days" value={String(stats.migraineDays)} />
        <StatCard label="Average pain" value={formatAveragePain(stats.averagePain, stats.migraineDays)} />
        <StatCard label="Severe days" value={String(stats.severeDays)} />
      </div>

      <div className="card space-y-4">
        <MonthNavigator
          basePath="/dashboard/health/migraine"
          monthKey={monthKey}
          monthLabel={monthLabel}
          dayValue={selectedDay ?? undefined}
        />

        <div>
          <div className="grid grid-cols-7 text-center text-[10px] font-medium text-slate-500 sm:text-xs">
            {WEEKDAYS.map((d) => (
              <div key={d} className="px-0.5 py-1.5">
                <span className="sm:hidden">{d[0]}</span>
                <span className="hidden sm:inline">{d}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const key = toDateInputValue(day);
              const inMonth = day.getMonth() === month! - 1 && day.getFullYear() === year;
              const isToday = key === todayKey;
              const isSelected = key === selectedDay;
              const isFuture = key > todayKey;
              const entry = logMap[key];

              return (
                <button
                  key={key}
                  type="button"
                  disabled={isFuture}
                  onClick={() => selectDay(day)}
                  aria-label={
                    entry
                      ? `${key}, pain ${entry.pain}`
                      : isFuture
                        ? `${key}, upcoming`
                        : `${key}, no migraine`
                  }
                  aria-pressed={isSelected}
                  className={clsx(
                    "touch-target flex flex-col items-center justify-center gap-0.5 rounded-lg p-1 text-sm transition",
                    isFuture && "cursor-not-allowed opacity-40",
                    !inMonth && "text-slate-400",
                    isToday && !isSelected && "ring-1 ring-inset ring-brand-400",
                    isSelected && "ring-2 ring-brand-500",
                    !isFuture && !isSelected && "hover:bg-slate-50 dark:hover:bg-slate-700/60"
                  )}
                >
                  <span className={clsx("text-xs font-medium", isToday && "text-brand-700 dark:text-brand-300")}>
                    {day.getDate()}
                  </span>
                  {entry ? (
                    <span
                      className={clsx(
                        "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold",
                        painToneClass(entry.pain)
                      )}
                    >
                      {entry.pain}
                    </span>
                  ) : (
                    <span className="h-6 w-6" />
                  )}
                </button>
              );
            })}
          </div>
          <p className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            <LegendSwatch className={painToneClass(2)} label="Mild 1–3" />
            <LegendSwatch className={painToneClass(5)} label="Moderate 4–6" />
            <LegendSwatch className={painToneClass(9)} label="Severe 7–10" />
          </p>
        </div>
      </div>

      <div className="card space-y-4">
        <div>
          <h2 className="section-title">{selectedLabel}</h2>
          {!selectedDay && (
            <p className="mt-1 text-sm text-slate-500">Tap a day on the calendar to log pain.</p>
          )}
          {isFutureSelected && (
            <p className="mt-1 text-sm text-slate-500">Future days stay empty until they arrive.</p>
          )}
        </div>

        {canEdit && (
          <>
            <div className="space-y-3">
              {PAIN_GROUPS.map((group) => (
                <div key={group.label}>
                  <p className="label">{group.label}</p>
                  <div className="flex flex-wrap gap-2">
                    {group.values.map((n) => {
                      const active = selected?.pain === n;
                      return (
                        <button
                          key={n}
                          type="button"
                          disabled={pending}
                          onClick={() => handlePain(n)}
                          aria-pressed={active}
                          className={clsx(
                            "touch-target min-w-[2.75rem] rounded-lg px-3 text-sm font-semibold ring-1 ring-inset transition disabled:opacity-50",
                            active
                              ? painToneClass(n)
                              : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-600 dark:hover:bg-slate-700"
                          )}
                        >
                          {n}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <CollapsibleSection key={selectedDay ?? "none"} title="More" defaultOpen={moreOpen}>
              <div className="space-y-4">
                <div>
                  <p className="label">Duration</p>
                  <div className="flex flex-wrap gap-2">
                    {DURATION_PRESETS.map((preset) => {
                      const active = selected?.durationMin === preset.minutes;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          disabled={pending || !selected}
                          onClick={() => handleDuration(preset.minutes)}
                          aria-pressed={active}
                          className={clsx(
                            "btn-ghost touch-target text-sm disabled:opacity-50",
                            active && "ring-2 ring-brand-500"
                          )}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                  {!selected && (
                    <p className="mt-2 text-xs text-slate-400">Set pain first, then duration.</p>
                  )}
                </div>

                <div>
                  <label htmlFor="migraine-note" className="label">
                    Note
                  </label>
                  <textarea
                    id="migraine-note"
                    className="input"
                    rows={3}
                    maxLength={2000}
                    disabled={!selected || pending}
                    placeholder="Triggers, meds, what helped — optional"
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                  />
                  <div className="mt-2">
                    <button
                      type="button"
                      className="btn-primary touch-target"
                      disabled={!selected || pending}
                      onClick={handleNoteSave}
                    >
                      Save note
                    </button>
                  </div>
                </div>
              </div>
            </CollapsibleSection>

            {selected && (
              <button
                type="button"
                className="btn-danger touch-target"
                disabled={pending}
                onClick={() => setConfirmClear(true)}
              >
                Clear day
              </button>
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        open={confirmClear}
        title="Clear this day?"
        message="The migraine entry for this day will be removed."
        confirmLabel="Clear"
        onConfirm={() => {
          setConfirmClear(false);
          handleClear();
        }}
        onCancel={() => setConfirmClear(false)}
      />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card py-3 text-center">
      <p className="text-2xl font-semibold tabular-nums text-slate-900 dark:text-slate-100">{value}</p>
      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}

function LegendSwatch({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={clsx("h-3 w-3 rounded-full", className)} />
      {label}
    </span>
  );
}
