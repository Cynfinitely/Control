"use client";

import { useMemo, useState } from "react";
import { formatEuro } from "@/lib/budget";
import { toDateInputValue } from "@/lib/date";
import SubmitButton from "@/components/SubmitButton";
import FormAction from "@/components/FormAction";
import {
  categorizeTransactionForm,
  categorizeTransactionsBulkForm,
} from "./actions";

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
};

export default function UncategorizedQueue({ entries, categories }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const bulkKind = useMemo(() => {
    const kinds = new Set(
      entries.filter((e) => selected.has(e.id)).map((e) => e.type)
    );
    return kinds.size === 1 ? [...kinds][0] : null;
  }, [entries, selected]);

  const bulkCategories = useMemo(
    () => (bulkKind ? categories.filter((c) => c.kind === bulkKind) : []),
    [categories, bulkKind]
  );

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (entries.length === 0) {
    return (
      <p className="text-sm text-slate-400">All imported transactions have a category.</p>
    );
  }

  return (
    <div className="space-y-4">
      {selected.size > 0 && bulkKind && (
        <FormAction
          action={categorizeTransactionsBulkForm}
          successMessage="Categories saved"
          className="card flex flex-wrap items-end gap-3 border-brand-200 bg-brand-50/50"
        >
          {[...selected].map((id) => (
            <input key={id} type="hidden" name="ids" value={id} />
          ))}
          <div className="min-w-[12rem] flex-1">
            <label className="label">
              Apply to {selected.size} selected ({bulkKind})
            </label>
            <select name="categoryId" className="input" required defaultValue={bulkCategories[0]?.id}>
              {bulkCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <SubmitButton className="btn-primary touch-target">Apply category</SubmitButton>
        </FormAction>
      )}

      <div className="space-y-2">
        {entries.map((entry) => {
          const filtered = categories.filter((c) => c.kind === entry.type);
          return (
            <div key={entry.id} className="card py-3">
              <div className="flex flex-wrap items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={selected.has(entry.id)}
                  onChange={() => toggle(entry.id)}
                  aria-label="Select transaction"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-800">
                    {entry.rawDescription || entry.note || entry.merchantKey || "Transaction"}
                  </p>
                  <p className="text-xs text-slate-400">
                    {toDateInputValue(entry.date)} · {entry.type}
                    {entry.merchantKey ? ` · ${entry.merchantKey}` : ""}
                  </p>
                </div>
                <p
                  className={`shrink-0 font-semibold ${
                    entry.type === "income" ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  {entry.type === "income" ? "+" : "−"}
                  {formatEuro(entry.amountCents)}
                </p>
              </div>
              <FormAction
                action={categorizeTransactionForm}
                successMessage="Category saved"
                className="mt-3 flex flex-wrap items-end gap-2 border-t border-slate-100 pt-3"
              >
                <input type="hidden" name="id" value={entry.id} />
                <div className="min-w-[10rem] flex-1">
                  <label className="label">Category</label>
                  <select
                    name="categoryId"
                    className="input"
                    required
                    defaultValue={filtered[0]?.id}
                  >
                    {filtered.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <SubmitButton className="btn-primary touch-target">Save</SubmitButton>
              </FormAction>
            </div>
          );
        })}
      </div>
    </div>
  );
}
