"use client";

import { useRouter } from "next/navigation";
import { RELATIONSHIPS, RELATIONSHIP_LABELS } from "@/lib/contacts";
import ActionForm from "@/components/ActionForm";
import FormField from "@/components/FormField";
import SubmitButton from "@/components/SubmitButton";
import { useToast } from "@/components/Toast";
import { createContact, type CreateContactResult } from "./actions";

export default function AddPersonForm() {
  const router = useRouter();
  const toast = useToast();

  return (
    <ActionForm
      action={createContact}
      successMessage={false}
      resetOnSuccess
      onSuccess={(result) => {
        const r = result as CreateContactResult | undefined;
        if (!r?.contactId) {
          toast.success("Person added");
          return;
        }
        const id = r.contactId;
        toast.success(`Added ${r.name ?? "person"}`, {
          label: "Log interaction",
          onClick: () => router.push(`/dashboard/networking?person=${encodeURIComponent(id)}`),
        });
      }}
      className="grid grid-cols-1 gap-4 sm:grid-cols-2"
    >
      <FormField label="Name" required>
        {(_id, aria) => <input {...aria} name="name" className="input" required autoComplete="off" />}
      </FormField>
      <FormField label="Relationship">
        {(_id, aria) => (
          <select {...aria} name="relationship" className="input" defaultValue="other">
            {RELATIONSHIPS.map((r) => (
              <option key={r} value={r}>
                {RELATIONSHIP_LABELS[r]}
              </option>
            ))}
          </select>
        )}
      </FormField>
      <div className="sm:col-span-2">
        <SubmitButton className="btn-primary">Add person</SubmitButton>
      </div>
    </ActionForm>
  );
}
