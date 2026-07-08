"use client";

import { useMemo, useState } from "react";
import { formatEuro, centsToEuros } from "@/lib/budget";
import { toDateInputValue } from "@/lib/date";
import Icon from "@/components/Icon";
import SubmitButton from "@/components/SubmitButton";
import SubmitIconButton from "@/components/SubmitIconButton";
import FormAction from "@/components/FormAction";
import { deleteTransaction, updateTransactionForm } from "./actions";

type Category = { id: string; name: string; kind: string };

type Entry = {
  id: string;
  type: string;
  amountCents: number;
  date: Date;
  note: string | null;
  categoryId?: string;
  categoryName: string;
};

type Props = {
  entry: Entry;
  categories: Category[];
};

export default function BudgetTransactionRow({ entry, categories }: Props) {
  const [editing, setEditing] = useState(false);
  const [type, setType] = useState<"expense" | "income">(
    entry.type === "income" ? "income" : "expense"
  );

  const filtered = useMemo(
    () => categories.filter((c) => c.kind === type),
    [categories, type]
  );

  return (
    <div className="card py-3">
      <div className="flex items-center gap-3">
        <span
          className={`badge capitalize ${
            entry.type === "income"
              ? "bg-emerald-100 text-emerald-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {entry.type}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-slate-800">
            {entry.note || entry.categoryName}
          </p>
          <p className="text-xs text-slate-400">{entry.categoryName}</p>
        </div>
        <p
          className={`shrink-0 font-semibold ${
            entry.type === "income" ? "text-emerald-600" : "text-red-600"
          }`}
        >
          {entry.type === "income" ? "+" : "−"}
          {formatEuro(entry.amountCents)}
        </p>
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          className="touch-target text-slate-300 hover:text-brand-600"
          title="Edit"
        >
          <Icon name="pencil" className="h-4 w-4" />
        </button>
        <form action={deleteTransaction}>
          <input type="hidden" name="id" value={entry.id} />
          <SubmitIconButton
            className="touch-target text-slate-300 hover:text-red-500"
            title="Delete"
            icon={<Icon name="trash" className="h-4 w-4" />}
          />
        </form>
      </div>

      {editing && (
        <FormAction
          action={updateTransactionForm}
          successMessage="Transaction updated"
          className="mt-4 grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2"
        >
          <input type="hidden" name="id" value={entry.id} />
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
              defaultValue={centsToEuros(entry.amountCents)}
              required
            />
          </div>
          <div>
            <label className="label">Category</label>
            <select
              key={type}
              name="categoryId"
              className="input"
              required
              defaultValue={
                filtered.some((c) => c.id === entry.categoryId)
                  ? entry.categoryId
                  : filtered[0]?.id
              }
            >
              {filtered.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Date</label>
            <input
              name="date"
              type="date"
              className="input"
              defaultValue={toDateInputValue(entry.date)}
              required
            />
          </div>
          <div>
            <label className="label">Note</label>
            <input
              name="note"
              className="input"
              defaultValue={entry.note ?? ""}
              placeholder="Optional description"
            />
          </div>
          <div className="flex items-end gap-2 sm:col-span-2">
            <SubmitButton className="btn-primary touch-target">Save changes</SubmitButton>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="btn-ghost touch-target"
            >
              Cancel
            </button>
          </div>
        </FormAction>
      )}
    </div>
  );
}
