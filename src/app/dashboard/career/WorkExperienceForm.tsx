"use client";

import { useState } from "react";
import ActionForm from "@/components/ActionForm";
import FormField from "@/components/FormField";
import SubmitButton from "@/components/SubmitButton";
import { createWorkExperience } from "./actions";

export default function WorkExperienceForm() {
  const [current, setCurrent] = useState(false);

  return (
    <ActionForm
      action={createWorkExperience}
      successMessage="Experience added"
      resetOnSuccess
      onSuccess={() => setCurrent(false)}
      className="grid grid-cols-1 gap-4 sm:grid-cols-2"
    >
      <FormField label="Company" required>
        {(_id, aria) => <input {...aria} name="company" className="input" required />}
      </FormField>
      <FormField label="Role" required>
        {(_id, aria) => <input {...aria} name="role" className="input" required />}
      </FormField>
      <FormField label="Start">
        {(_id, aria) => <input {...aria} name="startDate" type="date" className="input" />}
      </FormField>
      <FormField label="End" hint={current ? "Current role — no end date" : undefined}>
        {(_id, aria) => (
          <input {...aria} name="endDate" type="date" className="input" disabled={current} />
        )}
      </FormField>
      <label className="flex min-h-[44px] items-center gap-2 text-sm text-slate-700 dark:text-slate-300 sm:col-span-2">
        <input
          name="current"
          type="checkbox"
          className="h-4 w-4"
          checked={current}
          onChange={(e) => setCurrent(e.target.checked)}
        />
        Current role
      </label>
      <FormField label="Summary" className="sm:col-span-2">
        {(_id, aria) => <textarea {...aria} name="summary" className="input" rows={2} />}
      </FormField>
      <div className="sm:col-span-2">
        <SubmitButton className="btn-primary">Add experience</SubmitButton>
      </div>
    </ActionForm>
  );
}
