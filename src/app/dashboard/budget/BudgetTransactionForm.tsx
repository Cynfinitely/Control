"use client";

import { useMemo, useState } from "react";
import SubmitButton from "@/components/SubmitButton";
import FormAction from "@/components/FormAction";
import type { FormAction as FormActionFn } from "@/lib/action-result";

type Category = {
  id: string;
  name: string;
  kind: string;
};

type Props = {
  categories: Category[];
  dayValue: string;
  action: FormActionFn;
};

export default function BudgetTransactionForm({ categories, dayValue, action }: Props) {
  const [type, setType] = useState<"expense" | "income">("expense");

  const filtered = useMemo(
    () => categories.filter((c) => c.kind === type),
    [categories, type]
  );

  return (
    <FormAction
      action={action}
      successMessage="Transaction logged"
      className="card mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
    >
      <div className="sm:col-span-2">
        <label className="label">Type</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setType("expense")}
            className={`touch-target flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${
              type === "expense"
                ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300"
                : "border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-400"
            }`}
          >
            Expense
          </button>
          <button
            type="button"
            onClick={() => setType("income")}
            className={`touch-target flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${
              type === "income"
                ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                : "border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-400"
            }`}
          >
            Income
          </button>
        </div>
        <input type="hidden" name="type" value={type} />
      </div>
      <div>
        <label htmlFor="budget-amount" className="label">
          Amount (€)
        </label>
        <input
          id="budget-amount"
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          className="input"
          placeholder="0.00"
          required
        />
      </div>
      <div>
        <label htmlFor="budget-category" className="label">
          Category
        </label>
        <select key={type} id="budget-category" name="categoryId" className="input" required defaultValue={filtered[0]?.id}>
          {filtered.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="budget-note" className="label">
          Note
        </label>
        <input id="budget-note" name="note" className="input" placeholder="Optional description" />
      </div>
      <div>
        <label htmlFor="budget-date" className="label">
          Date
        </label>
        <input id="budget-date" name="date" type="date" className="input" defaultValue={dayValue} />
      </div>
      <div className="flex items-end">
        <SubmitButton className="btn-primary touch-target w-full">Log transaction</SubmitButton>
      </div>
    </FormAction>
  );
}
