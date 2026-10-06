"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import Icon from "@/components/Icon";
import IconButton from "@/components/IconButton";
import SegmentedControl from "@/components/SegmentedControl";
import Spinner from "@/components/Spinner";
import { useToast } from "@/components/Toast";
import { PRAYERS } from "@/lib/prayer-debt";
import { prayerLabel, prayersToMarkOnTime, type PrayerStatusValue } from "@/lib/religious/day-prayers";
import type { ActionResult } from "@/lib/action-result";
import { clearPrayer, markAllPrayersOnTime, setPrayer } from "./actions";

type PrayerStatus = Record<string, string | undefined>;

type Props = {
  dayValue: string;
  /** "today", "yesterday" or a formatted date, used in messages. */
  dayName: string;
  initialStatuses: PrayerStatus;
  /** Prayers of this day whose qaza has already been made up. */
  madeUp?: string[];
};

const STATUS_OPTIONS: { value: PrayerStatusValue; label: string }[] = [
  { value: "ontime", label: "On time" },
  { value: "missed", label: "Missed" },
];

/** `null` override = cleared locally, waiting for the server. */
type Overrides = Record<string, PrayerStatusValue | null>;

function StatusText({ status, madeUp }: { status: string | undefined; madeUp: boolean }) {
  if (status === "ontime") {
    return (
      <span className="badge-success">
        <Icon name="check" className="h-3.5 w-3.5" />
        On time
      </span>
    );
  }
  if (status === "missed" && madeUp) {
    return (
      <span className="badge-muted">
        <Icon name="check" className="h-3.5 w-3.5" />
        Missed · made up
      </span>
    );
  }
  if (status === "missed") {
    return (
      <span className="badge-danger">
        <Icon name="x" className="h-3.5 w-3.5" />
        Missed · in qaza
      </span>
    );
  }
  return <span className="badge-muted">Not logged</span>;
}

/**
 * Per-prayer status rows. Each row updates optimistically and only that row
 * waits for the server, so all five can be marked in quick succession.
 */
export default function PrayerStatusPanel({ dayValue, dayName, initialStatuses, madeUp = [] }: Props) {
  const toast = useToast();
  const [overrides, setOverrides] = useState<Overrides>({});
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const [bulkPending, setBulkPending] = useState(false);

  // Drop local overrides once the server-rendered statuses catch up.
  useEffect(() => {
    setOverrides((current) => {
      let changed = false;
      const next: Overrides = {};
      for (const [prayer, value] of Object.entries(current)) {
        if ((initialStatuses[prayer] ?? null) === value) changed = true;
        else next[prayer] = value;
      }
      return changed ? next : current;
    });
  }, [initialStatuses]);

  const statuses: PrayerStatus = Object.fromEntries(
    PRAYERS.map((p) => [p, p in overrides ? overrides[p] ?? undefined : initialStatuses[p]])
  );
  const unlogged = prayersToMarkOnTime(statuses);
  const missedCount = PRAYERS.filter((p) => statuses[p] === "missed").length;

  function revert(prayers: readonly string[]) {
    setOverrides((current) => {
      const next = { ...current };
      for (const p of prayers) delete next[p];
      return next;
    });
  }

  async function run(prayers: readonly string[], call: () => Promise<ActionResult>) {
    try {
      const result = await call();
      if (!result.ok) {
        revert(prayers);
        toast.error(result.error);
      } else if (result.message) {
        toast.success(result.message);
      }
    } catch {
      revert(prayers);
      toast.error("Couldn't save. Check your connection and try again.");
    }
  }

  async function handleSet(prayer: string, status: PrayerStatusValue) {
    if (statuses[prayer] === status || pending[prayer]) return;
    setOverrides((o) => ({ ...o, [prayer]: status }));
    setPending((p) => ({ ...p, [prayer]: true }));
    const fd = new FormData();
    fd.set("prayer", prayer);
    fd.set("status", status);
    fd.set("date", dayValue);
    await run([prayer], () => setPrayer(fd));
    setPending((p) => ({ ...p, [prayer]: false }));
  }

  async function handleClear(prayer: string) {
    if (!statuses[prayer] || pending[prayer]) return;
    setOverrides((o) => ({ ...o, [prayer]: null }));
    setPending((p) => ({ ...p, [prayer]: true }));
    const fd = new FormData();
    fd.set("prayer", prayer);
    fd.set("date", dayValue);
    await run([prayer], () => clearPrayer(fd));
    setPending((p) => ({ ...p, [prayer]: false }));
  }

  async function handleMarkAll() {
    const targets = unlogged.filter((p) => !pending[p]);
    if (targets.length === 0) return;
    setBulkPending(true);
    setOverrides((o) => {
      const next = { ...o };
      for (const p of targets) next[p] = "ontime";
      return next;
    });
    const fd = new FormData();
    fd.set("date", dayValue);
    await run(targets, () => markAllPrayersOnTime(fd));
    setBulkPending(false);
  }

  return (
    <div>
      <ul className="divide-y divide-slate-100 dark:divide-slate-700">
        {PRAYERS.map((p) => {
          const current = statuses[p];
          const label = prayerLabel(p);
          const rowPending = Boolean(pending[p]) || (bulkPending && unlogged.includes(p));
          return (
            <li key={p} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-2 first:pt-0 last:pb-0">
              <div className="flex min-w-[9rem] flex-1 items-center gap-2">
                <span id={`prayer-${p}-label`} className="w-16 font-medium text-slate-800 dark:text-slate-100">
                  {label}
                </span>
                <StatusText status={current} madeUp={madeUp.includes(p)} />
                {rowPending && (
                  <span className="text-muted" aria-label={`Saving ${label}`}>
                    <Spinner className="h-3.5 w-3.5" />
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <SegmentedControl
                  options={STATUS_OPTIONS}
                  value={(current as PrayerStatusValue | undefined) ?? null}
                  onChange={(status) => handleSet(p, status)}
                  disabled={rowPending}
                  aria-label={`${label} status`}
                />
                <IconButton
                  icon="x"
                  aria-label={`Clear ${label} status`}
                  title={current ? `Clear ${label} status` : `${label} has no status`}
                  disabled={!current || rowPending}
                  onClick={() => handleClear(p)}
                  className={clsx("btn-icon", !current && "invisible")}
                />
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
        <p className="hint mt-0 flex items-start gap-1.5">
          <Icon name="info" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            Missed prayers are added to your qaza list automatically. Clearing a status (×) removes the qaza
            entry it created.
          </span>
        </p>
        <button
          type="button"
          className="btn-ghost touch-target shrink-0"
          disabled={unlogged.length === 0 || bulkPending}
          onClick={handleMarkAll}
          title={
            unlogged.length === 0
              ? `Every prayer for ${dayName} already has a status`
              : missedCount > 0
                ? "Prayers marked missed stay missed"
                : undefined
          }
        >
          {bulkPending ? <Spinner /> : <Icon name="check" className="h-4 w-4" />}
          {unlogged.length === 0 || unlogged.length === PRAYERS.length
            ? "Mark all on time"
            : `Mark remaining ${unlogged.length} on time`}
        </button>
      </div>
    </div>
  );
}
