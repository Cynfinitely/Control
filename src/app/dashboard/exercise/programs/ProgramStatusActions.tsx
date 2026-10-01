"use client";

import ActionForm from "@/components/ActionForm";
import Icon from "@/components/Icon";
import SubmitButton from "@/components/SubmitButton";
import { archiveProgram, restoreProgram } from "./actions";

export default function ProgramStatusActions({
  id,
  name,
  archived,
}: {
  id: string;
  name: string;
  archived: boolean;
}) {
  if (archived) {
    return (
      <ActionForm action={restoreProgram} successMessage="Program restored">
        <input type="hidden" name="id" value={id} />
        <SubmitButton className="btn-ghost touch-target w-full sm:w-auto">
          <Icon name="undo" className="h-4 w-4" />
          Restore
        </SubmitButton>
      </ActionForm>
    );
  }

  return (
    <ActionForm
      action={archiveProgram}
      successMessage="Program archived"
      confirm={{
        title: `Archive “${name}”?`,
        message: "It will be hidden from your active list. You can restore it later.",
        confirmLabel: "Archive",
      }}
    >
      <input type="hidden" name="id" value={id} />
      <SubmitButton className="btn-ghost touch-target w-full sm:w-auto">Archive</SubmitButton>
    </ActionForm>
  );
}
