"use client";

import { useOptimistic, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import MonthNavigator from "@/components/MonthNavigator";
import CollapsibleSection from "@/components/CollapsibleSection";
import ConfirmDialog from "@/components/ConfirmDialog";
import StatCard from "@/components/StatCard";
import { useToast } from "@/components/Toast";
import { monthGridDays } from "@/lib/calendar/format";
import { toDateInputValue, toMonthKey } from "@/lib/date";
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

/** "1 October" — readable cell names for screen readers. */
function spokenDay(day: Date): string {
  return day.toLocaleDateString("en-GB", { day: "numeric", month: "long" });
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
  const { error, success } = useToast();
  const panelRef = useRef<HTMLElement>(null);
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
  // Stats cover the shown month only (the grid also holds neighbouring days).
  const stats = monthMigraineStats(
    Object.entries(logMap)
      .filter(([key]) => key.startsWith(monthKey))
      .map(([, entry]) => entry)
  );
  const selected = selectedDay ? logMap[selectedDay] : undefined;
  const isFutureSelected = Boolean(selectedDay && selectedDay > todayKey);
  const canEdit = Boolean(selectedDay) && !isFutureSelected;
  const moreOpen = Boolean(selected?.durationMin || selected?.note);

  function selectDay(day: Date) {
    const key = toDateInputValue(day);
    if (key > todayKey) return;
    // Leading/trailing cells belong to the neighbouring month: switch the
    // calendar to that month so the panel never edits a day outside it.
    const targetMonth = toMonthKey(day);
    const params = new URLSearchParams();
    if (targetMonth !== toMonthKey(new Date())) params.set("month", targetMonth);
    if (key !== todayKey) params.set("day", key);
    const qs = params.toString();
    router.push(`/dashboard/health/migraine${qs ? `?${qs}` : ""}`, { scroll: false });
    // On small screens the day panel sits above the calendar: bring it into view.
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches) {
      panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function runSave(date: string, entry: LogEntry, fd: FormData, successMessage?: string) {
    startTransition(async () => {
      setOptimistic({ date, entry });
      try {
        const result = await saveMigraineLog(fd);
        if (!result.ok) {
          error(result.error);
          router.refresh();
        } else if (successMessage) {
          success(successMessage);
        }
      } catch {
        error("Couldn't save. Check your connection and try again.");
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
    runSave(
      selectedDay,
      { ...selected, note: noteDraft.trim() === "" ? null : noteDraft.trim() },
      fd,
      noteDraft.trim() === "" ? "Note removed" : "Note saved"
    );
  }

  function handleClear() {
    if (!selectedDay || !canEdit || !selected) return;
    const fd = new FormData();
    fd.set("date", selectedDay);
    startTransition(async () => {
      setOptimistic({ date: selectedDay, entry: null });
      setNoteDraft("");
      try {
        const result = await clearMigraineLog(fd);
        if (!result.ok) {
          error(result.error);
          router.refresh();
        } else {
          success("Day cleared");
        }
      } catch {
        error("Couldn't clear the day. Please try again.");
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
      <div className="order-3 grid grid-cols-3 gap-3 lg:order-none lg:col-span-2">
        <StatCard size="sm" label="Migraine days" value={stats.migraineDays} hint={`in ${monthLabel.split(" ")[0]}`} />
        <StatCard size="sm" label="Average pain" value={formatAveragePain(stats.averagePain, stats.migraineDays)} hint="of 10" />
        <StatCard size="sm" label="Severe days" value={stats.severeDays} hint="pain 7–10" />
      </div>

      <div className="card order-2 space-y-4 lg:order-none">
        <MonthNavigator
          basePath="/dashboard/health/migraine"
          monthKey={monthKey}
          monthLabel={monthLabel}
          dayValue={selectedDay ?? undefined}
        />

        <div>
          <div className="grid grid-cols-7 text-center text-[10px] font-medium text-slate-500 dark:text-slate-400 sm:text-xs">
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
                      ? `${spokenDay(day)}, pain ${entry.pain} of 10`
                      : isFuture
                        ? `${spokenDay(day)}, upcoming`
                        : `${spokenDay(day)}, no migraine`
                  }
                  aria-pressed={isSelected}
                  className={clsx(
                    "touch-target flex flex-col items-center justify-center gap-0.5 rounded-lg p-1 text-sm transition",
                    isFuture && "cursor-not-allowed opacity-40",
                    !inMonth && "text-slate-500 dark:text-slate-400",
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

      <section
        ref={panelRef}
        className="card order-1 scroll-mt-4 space-y-4 lg:order-none lg:sticky lg:top-6"
        aria-labelledby="migraine-day-title"
      >
        <div>
          <h2 id="migraine-day-title" className="section-title">
            {selectedLabel}
          </h2>
          {!selectedDay && (
            <p className="mt-1 text-sm text-muted">Tap a day on the calendar to log pain.</p>
          )}
          {isFutureSelected && (
            <p className="mt-1 text-sm text-muted">Future days stay empty until they arrive.</p>
          )}
        </div>

        {canEdit && (
          <>
            <div className="space-y-3">
              {PAIN_GROUPS.map((group) => (
                <fieldset key={group.label}>
                  <legend className="label">{group.label}</legend>
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
                          aria-label={`Pain ${n} of 10`}
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
                </fieldset>
              ))}
            </div>

            <CollapsibleSection key={selectedDay ?? "none"} title="More" defaultOpen={moreOpen}>
              <div className="space-y-4">
                <fieldset>
                  <legend className="label">Duration</legend>
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
                            "chip touch-target disabled:cursor-not-allowed disabled:opacity-50",
                            active ? "chip-active" : "chip-idle"
                          )}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                  {!selected && <p className="hint">Set a pain level first, then duration.</p>}
                </fieldset>

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
                    aria-describedby="migraine-note-hint"
                    placeholder="Triggers, meds, what helped — optional"
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                  />
                  <p id="migraine-note-hint" className="hint">
                    {selected ? "Optional. Saved when you press Save note." : "Set a pain level first to add a note."}
                  </p>
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
      </section>

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

function LegendSwatch({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={clsx("h-3 w-3 rounded-full", className)} />
      {label}
    </span>
  );
}
