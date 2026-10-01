"use client";

import { useId, useMemo, useState } from "react";
import { formatEuro, centsToEuros } from "@/lib/budget";
import { formatDate, toDateInputValue } from "@/lib/date";
import Icon from "@/components/Icon";
import IconButton from "@/components/IconButton";
import ActionForm from "@/components/ActionForm";
import SubmitButton from "@/components/SubmitButton";
import SubmitIconButton from "@/components/SubmitIconButton";
import SegmentedControl from "@/components/SegmentedControl";
import { deleteTransaction, updateTransaction } from "./actions";

type Category = { id: string; name: string; kind: string };

type Entry = {
  id: string;
  type: string;
  amountCents: number;
  date: Date;
  note: string | null;
  categoryId?: string | null;
  categoryName: string;
  rawDescription?: string | null;
  merchantKey?: string | null;
};

type Props = {
  entry: Entry;
  categories: Category[];
};

const TYPE_OPTIONS = [
  { value: "expense", label: "Expense" },
  { value: "income", label: "Income" },
] as const;

export default function BudgetTransactionRow({ entry, categories }: Props) {
  const id = useId();
  const [editing, setEditing] = useState(false);
  const [type, setType] = useState<"expense" | "income">(entry.type === "income" ? "income" : "expense");

  const filtered = useMemo(() => categories.filter((c) => c.kind === type), [categories, type]);
  const income = entry.type === "income";
  const title = entry.rawDescription || entry.note || entry.categoryName;
  const amount = `${income ? "+" : "−"}${formatEuro(entry.amountCents)}`;
  const uncategorized = !entry.categoryId;
  const formId = `${id}-edit`;

  return (
    <div className="card py-3">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="break-words font-medium text-slate-800 dark:text-slate-100">{title}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
            <span className={income ? "badge-success" : "badge-muted"}>{income ? "Income" : "Expense"}</span>
            <span className={uncategorized ? "badge-warning" : undefined}>{entry.categoryName}</span>
          </p>
        </div>
        <div className="-mr-2 flex shrink-0 flex-col items-end">
          <p
            className={`pr-2 pt-0.5 font-semibold tabular-nums ${
              income ? "text-green-700 dark:text-green-400" : "text-slate-900 dark:text-slate-100"
            }`}
          >
            {amount}
          </p>
          <div className="-mb-2 flex">
            <IconButton
              icon="pencil"
              aria-label={`Edit ${title}`}
              aria-expanded={editing}
              aria-controls={formId}
              onClick={() => setEditing((v) => !v)}
            />
            <ActionForm
              action={deleteTransaction}
              confirm={{
                title: `Delete “${title}”?`,
                message: `${amount} on ${formatDate(entry.date)} will be removed from your budget. Re-importing the same file restores it.`,
              }}
            >
              <input type="hidden" name="id" value={entry.id} />
              <SubmitIconButton
                icon={<Icon name="trash" className="h-4 w-4" />}
                aria-label={`Delete ${title}`}
                className="btn-icon-danger"
              />
            </ActionForm>
          </div>
        </div>
      </div>

      {editing && (
        <ActionForm
          id={formId}
          action={updateTransaction}
          successMessage="Transaction updated"
          onSuccess={() => setEditing(false)}
          className="mt-4 grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2 dark:border-slate-700"
        >
          <input type="hidden" name="id" value={entry.id} />
          <div className="sm:col-span-2">
            <p className="label">
              Type
            </p>
            <SegmentedControl
              aria-label="Transaction type"
              options={TYPE_OPTIONS}
              value={type}
              onChange={setType}
              fill
            />
            <input type="hidden" name="type" value={type} />
          </div>
          <div>
            <label className="label" htmlFor={`${id}-amount`}>
              Amount (€)
            </label>
            <input
              id={`${id}-amount`}
              name="amount"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0.01"
              className="input"
              defaultValue={centsToEuros(entry.amountCents)}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor={`${id}-category`}>
              Category
            </label>
            <select
              key={type}
              id={`${id}-category`}
              name="categoryId"
              className="input"
              required
              defaultValue={entry.categoryId && filtered.some((c) => c.id === entry.categoryId) ? entry.categoryId : ""}
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
          <div>
            <label className="label" htmlFor={`${id}-date`}>
              Date
            </label>
            <input
              id={`${id}-date`}
              name="date"
              type="date"
              className="input"
              defaultValue={toDateInputValue(entry.date)}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor={`${id}-note`}>
              Note
            </label>
            <input
              id={`${id}-note`}
              name="note"
              className="input"
              defaultValue={entry.note ?? ""}
              placeholder="Optional description"
            />
          </div>
          <div className="flex flex-wrap items-end gap-2 sm:col-span-2">
            <SubmitButton className="btn-primary touch-target" pendingLabel="Saving…">
              Save changes
            </SubmitButton>
            <button type="button" onClick={() => setEditing(false)} className="btn-ghost touch-target">
              Cancel
            </button>
          </div>
        </ActionForm>
      )}
    </div>
  );
}
