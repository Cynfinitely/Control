"use client";

import { useState } from "react";
import ActionForm from "@/components/ActionForm";
import SubmitButton from "@/components/SubmitButton";
import FormField from "@/components/FormField";
import { useModules } from "@/components/ModulesProvider";
import { createGoal } from "./actions";

export default function AddGoalForm({ period, periodKey }: { period: string; periodKey: string }) {
  const modules = useModules();
  const [type, setType] = useState<"boolean" | "numeric">("boolean");
  const isCounter = type === "numeric";

  return (
    <ActionForm
      action={createGoal}
      successMessage="Goal added"
      resetOnSuccess
      onSuccess={() => setType("boolean")}
      className="grid grid-cols-1 gap-4 sm:grid-cols-2"
    >
      <input type="hidden" name="period" value={period} />
      <input type="hidden" name="periodKey" value={periodKey} />
      <FormField label="Title" className="sm:col-span-2" required>
        {(_id, aria) => (
          <input {...aria} name="title" className="input" placeholder="e.g. Gym 12 times" required />
        )}
      </FormField>
      <FormField label="Type">
        {(_id, aria) => (
          <select
            {...aria}
            name="type"
            className="input"
            value={type}
            onChange={(e) => setType(e.target.value === "numeric" ? "numeric" : "boolean")}
          >
            <option value="boolean">Checkbox (done / not done)</option>
            <option value="numeric">Counter (+1 each time)</option>
          </select>
        )}
      </FormField>
      {isCounter && (
        <>
          <FormField label="Target" hint="How many times this period (defaults to 1)">
            {(_id, aria) => (
              <input
                {...aria}
                name="targetValue"
                type="number"
                min={1}
                className="input"
                placeholder="e.g. 12"
              />
            )}
          </FormField>
          <FormField
            label="Auto-track from"
            className="sm:col-span-2"
            hint="Linked goals count up automatically when you log the activity."
          >
            {(_id, aria) => (
              <select {...aria} name="linkType" className="input" defaultValue="">
                <option value="">Manual only</option>
                {modules.has("exercise") && <option value="workout">Workouts logged</option>}
                {modules.has("career") && <option value="learning">Learning hours logged</option>}
                {modules.has("religious") && <option value="quran">Quran pages read</option>}
              </select>
            )}
          </FormField>
        </>
      )}
      <div className="sm:col-span-2">
        <SubmitButton className="btn-primary">Add goal</SubmitButton>
      </div>
    </ActionForm>
  );
}
