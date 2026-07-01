"use client";

import { useMemo, useState } from "react";
import { PRAYERS, estimatePrayerDebtDays } from "@/lib/prayer-debt";
import SubmitButton from "@/components/SubmitButton";
import { savePrayerDebt } from "./actions";

type ExistingDebt = {
  prayer: string;
  owed: number;
  fulfilled: number;
  periodStart: Date | null;
  periodEnd: Date | null;
  note: string | null;
};

type PrayerDebtSetupProps = {
  existingDebts: ExistingDebt[];
};

export default function PrayerDebtSetup({ existingDebts }: PrayerDebtSetupProps) {
  const first = existingDebts[0];
  const [periodStart, setPeriodStart] = useState(
    first?.periodStart ? new Date(first.periodStart).toISOString().slice(0, 10) : ""
  );
  const [periodEnd, setPeriodEnd] = useState(
    first?.periodEnd ? new Date(first.periodEnd).toISOString().slice(0, 10) : ""
  );
  const [note, setNote] = useState(first?.note ?? "");
  const [counts, setCounts] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    for (const prayer of PRAYERS) {
      const row = existingDebts.find((d) => d.prayer === prayer);
      initial[prayer] = row?.owed ?? 0;
    }
    return initial;
  });

  const estimatedDays = useMemo(() => {
    if (!periodStart || !periodEnd) return 0;
    const start = new Date(periodStart + "T00:00:00");
    const end = new Date(periodEnd + "T00:00:00");
    return estimatePrayerDebtDays(start, end);
  }, [periodStart, periodEnd]);

  function applyEstimate() {
    if (estimatedDays <= 0) return;
    const next: Record<string, number> = {};
    for (const prayer of PRAYERS) {
      next[prayer] = estimatedDays;
    }
    setCounts(next);
  }

  return (
    <form action={savePrayerDebt} className="mt-4 space-y-4">
      <p className="text-sm text-slate-500">
        If you started praying later in life, enter the period you owe prayers for. The calculator
        estimates one prayer per day per salah; adjust the counts before saving.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Period start</label>
          <input
            name="periodStart"
            type="date"
            className="input"
            value={periodStart}
            onChange={(e) => setPeriodStart(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Period end</label>
          <input
            name="periodEnd"
            type="date"
            className="input"
            value={periodEnd}
            onChange={(e) => setPeriodEnd(e.target.value)}
          />
        </div>
      </div>
      {estimatedDays > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">
          <span>
            Estimated <strong>{estimatedDays}</strong> days × 5 prayers ={" "}
            <strong>{estimatedDays * 5}</strong> total
          </span>
          <button type="button" onClick={applyEstimate} className="btn-ghost py-1 text-xs">
            Apply to all prayers
          </button>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {PRAYERS.map((prayer) => (
          <div key={prayer}>
            <label className="label capitalize">{prayer}</label>
            <input
              name={`owed_${prayer}`}
              type="number"
              min={0}
              className="input"
              value={counts[prayer] || ""}
              onChange={(e) =>
                setCounts((prev) => ({
                  ...prev,
                  [prayer]: parseInt(e.target.value, 10) || 0,
                }))
              }
            />
          </div>
        ))}
      </div>
      <div>
        <label className="label">Note (optional)</label>
        <input name="note" className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Before I started praying regularly" />
      </div>
      <SubmitButton className="btn-primary touch-target">Save historical debt</SubmitButton>
    </form>
  );
}
