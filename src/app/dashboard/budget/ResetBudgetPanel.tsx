"use client";

import FormAction from "@/components/FormAction";
import SubmitButton from "@/components/SubmitButton";
import { resetBudgetDataForm } from "./actions";

export default function ResetBudgetPanel() {
  return (
    <details className="card mt-8 border-red-100">
      <summary className="cursor-pointer font-medium text-red-700">Reset all budget data</summary>
      <p className="mt-3 text-sm text-slate-600">
        Permanently deletes all transactions, import batches, and merchant category rules. Categories
        are kept. Use this before importing a clean July statement.
      </p>
      <FormAction
        action={resetBudgetDataForm}
        successMessage="Budget data cleared"
        className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
      >
        <div className="min-w-0 flex-1">
          <label className="label" htmlFor="budget-reset-confirm">
            Type RESET to confirm
          </label>
          <input
            id="budget-reset-confirm"
            name="confirm"
            className="input"
            placeholder="RESET"
            autoComplete="off"
            required
          />
        </div>
        <SubmitButton className="btn-ghost touch-target text-red-700" pendingLabel="Clearing…">
          Clear budget data
        </SubmitButton>
      </FormAction>
    </details>
  );
}
