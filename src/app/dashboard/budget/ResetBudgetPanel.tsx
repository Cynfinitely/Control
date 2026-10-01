"use client";

import FormAction from "@/components/FormAction";
import SubmitButton from "@/components/SubmitButton";
import CollapsibleSection from "@/components/CollapsibleSection";
import { resetBudgetDataForm } from "./actions";

export default function ResetBudgetPanel() {
  return (
    <CollapsibleSection
      variant="card"
      icon="alert"
      title="Reset all budget data"
      className="border-red-200 dark:border-red-900"
    >
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Permanently deletes all transactions, import batches and merchant category rules. Categories are kept. Use this
        to start over from a clean import.
      </p>
      <FormAction
        action={resetBudgetDataForm}
        successMessage="Budget data cleared"
        confirm={{
          title: "Delete all budget data?",
          message:
            "Every transaction, import and merchant rule will be permanently deleted. Categories are kept. This can't be undone.",
          confirmLabel: "Delete everything",
        }}
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
            pattern="[Rr][Ee][Ss][Ee][Tt]"
            title="Type RESET"
            required
          />
        </div>
        <SubmitButton className="btn-danger touch-target" pendingLabel="Clearing…">
          Clear budget data
        </SubmitButton>
      </FormAction>
    </CollapsibleSection>
  );
}
