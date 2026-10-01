"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatEuro } from "@/lib/budget";
import { formatDate } from "@/lib/date";
import ActionForm from "@/components/ActionForm";
import SubmitButton from "@/components/SubmitButton";
import Icon from "@/components/Icon";
import { categorizeTransaction, categorizeTransactionsBulk } from "./actions";

type Category = { id: string; name: string; kind: string };

type Entry = {
  id: string;
  type: string;
  amountCents: number;
  date: Date;
  note: string | null;
  merchantKey: string | null;
  rawDescription: string | null;
};

type Props = {
  entries: Entry[];
  categories: Category[];
  /** Full count for the current filter (entries may be capped). */
  total: number;
};

const CHECKBOX = "h-5 w-5 cursor-pointer rounded border-slate-400 accent-brand-600 dark:border-slate-500";

function describe(entry: Entry): string {
  return entry.rawDescription || entry.note || entry.merchantKey || "Transaction";
}

function typeLabel(type: string, plural = false): string {
  if (type === "income") return "income";
  return plural ? "expenses" : "expense";
}

export default function UncategorizedQueue({ entries, categories, total }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const selectAllRef = useRef<HTMLInputElement>(null);

  // Rows disappear once categorized; only count selections that are still listed.
  const selectedEntries = useMemo(() => entries.filter((e) => selected.has(e.id)), [entries, selected]);
  const selectedExpenses = selectedEntries.filter((e) => e.type !== "income").length;
  const selectedIncome = selectedEntries.filter((e) => e.type === "income").length;
  const mixed = selectedExpenses > 0 && selectedIncome > 0;
  const bulkKind = selectedEntries.length > 0 && !mixed ? (selectedIncome > 0 ? "income" : "expense") : null;
  const bulkCategories = useMemo(
    () => (bulkKind ? categories.filter((c) => c.kind === bulkKind) : []),
    [categories, bulkKind]
  );
  const allSelected = entries.length > 0 && selectedEntries.length === entries.length;
  const someSelected = selectedEntries.length > 0 && !allSelected;

  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = someSelected;
  }, [someSelected]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function keepOnly(type: "income" | "expense") {
    setSelected(
      new Set(selectedEntries.filter((e) => (type === "income" ? e.type === "income" : e.type !== "income")).map((e) => e.id))
    );
  }

  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2">
        <label className="flex min-h-[44px] cursor-pointer items-center gap-3 text-sm font-medium text-slate-800 dark:text-slate-100">
          <input
            ref={selectAllRef}
            type="checkbox"
            className={CHECKBOX}
            checked={allSelected}
            onChange={() => setSelected(allSelected ? new Set() : new Set(entries.map((e) => e.id)))}
          />
          {allSelected ? "Deselect all" : `Select all ${entries.length}`}
          {selectedEntries.length > 0 && !allSelected && (
            <span className="font-normal text-muted">({selectedEntries.length} selected)</span>
          )}
        </label>
        <p className="text-sm text-muted" aria-live="polite">
          {total > entries.length
            ? `Showing ${entries.length} of ${total}. Categorize these to load more.`
            : `${total} to categorize`}
        </p>
      </div>

      {mixed && (
        <div
          role="status"
          className="card border-amber-200 bg-amber-50/70 dark:border-amber-900 dark:bg-amber-950/30"
        >
          <p className="flex items-start gap-2 text-sm text-slate-800 dark:text-slate-100">
            <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-400" />
            <span>
              Your selection mixes {selectedExpenses} {selectedExpenses === 1 ? "expense" : "expenses"} and{" "}
              {selectedIncome} income {selectedIncome === 1 ? "row" : "rows"}. Categories are either for expenses or for
              income, so bulk categorize works on one type at a time.
            </span>
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="btn-ghost btn-sm min-h-[36px]" onClick={() => keepOnly("expense")}>
              Keep only expenses ({selectedExpenses})
            </button>
            <button type="button" className="btn-ghost btn-sm min-h-[36px]" onClick={() => keepOnly("income")}>
              Keep only income ({selectedIncome})
            </button>
          </div>
        </div>
      )}

      {bulkKind && (
        <ActionForm
          action={categorizeTransactionsBulk}
          successMessage="Categories saved"
          onSuccess={() => setSelected(new Set())}
          className="card flex flex-col items-stretch gap-3 border-brand-200 bg-brand-50/50 dark:border-brand-800 dark:bg-brand-950/50 sm:flex-row sm:flex-wrap sm:items-end"
        >
          {selectedEntries.map((e) => (
            <input key={e.id} type="hidden" name="ids" value={e.id} />
          ))}
          <div className="min-w-0 flex-1 sm:min-w-[12rem]">
            <label className="label" htmlFor="bulk-category">
              Category for {selectedEntries.length} selected {typeLabel(bulkKind, selectedEntries.length !== 1)}
            </label>
            <select key={bulkKind} id="bulk-category" name="categoryId" className="input" required defaultValue="">
              <option value="" disabled>
                Choose a category…
              </option>
              {bulkCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <SubmitButton className="btn-primary touch-target" pendingLabel="Applying…">
            Apply to {selectedEntries.length}
          </SubmitButton>
        </ActionForm>
      )}

      <ul className="space-y-2">
        {entries.map((entry) => {
          const filtered = categories.filter((c) => c.kind === entry.type);
          const income = entry.type === "income";
          const amount = `${income ? "+" : "−"}${formatEuro(entry.amountCents)}`;
          const selectId = `uncat-category-${entry.id}`;
          return (
            <li key={entry.id} className="card py-3">
              <div className="flex items-start gap-3">
                <label className="-m-2 flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center">
                  <input
                    type="checkbox"
                    className={CHECKBOX}
                    checked={selected.has(entry.id)}
                    onChange={() => toggle(entry.id)}
                  />
                  <span className="sr-only">
                    Select {describe(entry)}, {amount}, {formatDate(entry.date)}
                  </span>
                </label>
                <div className="min-w-0 flex-1">
                  <p className="break-words font-medium text-slate-800 dark:text-slate-100">{describe(entry)}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                    <span>{formatDate(entry.date)}</span>
                    <span className={income ? "badge-success" : "badge-muted"}>{income ? "Income" : "Expense"}</span>
                    {entry.merchantKey && entry.merchantKey !== describe(entry) && (
                      <span className="break-all">{entry.merchantKey}</span>
                    )}
                  </p>
                </div>
                <p
                  className={`shrink-0 font-semibold tabular-nums ${
                    income ? "text-green-700 dark:text-green-400" : "text-slate-900 dark:text-slate-100"
                  }`}
                >
                  {amount}
                </p>
              </div>
              <ActionForm
                action={categorizeTransaction}
                successMessage="Categorized"
                className="mt-3 flex flex-col items-stretch gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:flex-wrap sm:items-end dark:border-slate-700"
              >
                <input type="hidden" name="id" value={entry.id} />
                <div className="min-w-0 flex-1 sm:min-w-[10rem]">
                  <label className="label" htmlFor={selectId}>
                    Category
                  </label>
                  <select
                    id={selectId}
                    name="categoryId"
                    className="input"
                    required
                    defaultValue=""
                    aria-describedby={entry.merchantKey ? `${selectId}-hint` : undefined}
                  >
                    <option value="" disabled>
                      Choose a category…
                    </option>
                    {filtered.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <SubmitButton className="btn-primary touch-target" pendingLabel="Saving…">
                  Save
                </SubmitButton>
                {entry.merchantKey && (
                  <p id={`${selectId}-hint`} className="hint mt-0 sm:basis-full">
                    Also applies to other {typeLabel(entry.type, true)} from {entry.merchantKey} and future imports.
                  </p>
                )}
              </ActionForm>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
