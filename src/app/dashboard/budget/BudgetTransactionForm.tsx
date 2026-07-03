"use client";

import { useMemo, useState } from "react";
import SubmitButton from "@/components/SubmitButton";

type Category = {
  id: string;
  name: string;
  kind: string;
};

type Props = {
  categories: Category[];
  dayValue: string;
  action: (formData: FormData) => Promise<void>;
};

export default function BudgetTransactionForm({ categories, dayValue, action }: Props) {
  const [type, setType] = useState<"expense" | "income">("expense");

  const filtered = useMemo(
    () => categories.filter((c) => c.kind === type),
    [categories, type]
  );

  return (
    <form action={action} className="card mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className="sm:col-span-2">
        <label className="label">Type</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setType("expense")}
            className={`touch-target flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${
              type === "expense"
                ? "border-brand-500 bg-brand-50 text-brand-700"
                : "border-slate-200 text-slate-600"
            }`}
          >
            Expense
          </button>
          <button
            type="button"
            onClick={() => setType("income")}
            className={`touch-target flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${
              type === "income"
                ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                : "border-slate-200 text-slate-600"
            }`}
          >
            Income
          </button>
        </div>
        <input type="hidden" name="type" value={type} />
      </div>
      <div>
        <label className="label">Amount (€)</label>
        <input
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
        <label className="label">Category</label>
        <select key={type} name="categoryId" className="input" required defaultValue={filtered[0]?.id}>
          {filtered.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2">
        <label className="label">Note</label>
        <input name="note" className="input" placeholder="Optional description" />
      </div>
      <div>
        <label className="label">Date</label>
        <input name="date" type="date" className="input" defaultValue={dayValue} />
      </div>
      <div className="flex items-end">
        <SubmitButton className="btn-primary touch-target w-full">Log transaction</SubmitButton>
      </div>
    </form>
  );
}
