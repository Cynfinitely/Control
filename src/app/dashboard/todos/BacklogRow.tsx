"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import SubmitButton from "@/components/SubmitButton";
import DeleteConfirmButton from "@/components/DeleteConfirmButton";
import FormAction from "@/components/FormAction";
import { deleteTodo, pullFromBacklogForm } from "./actions";

export default function BacklogRow({ id, title, dayValue }: { id: string; title: string; dayValue: string }) {
  const [, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-100 px-3 py-2 dark:border-slate-700">
      <span className="flex-1 text-slate-700 dark:text-slate-200">{title}</span>
      <FormAction action={pullFromBacklogForm} successMessage="Added to today">
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="dayDate" value={dayValue} />
        <SubmitButton className="btn-ghost touch-target text-xs">Add to today</SubmitButton>
      </FormAction>
      <DeleteConfirmButton
        title="Delete todo?"
        message="Remove this backlog item permanently?"
        onConfirm={() => {
          startTransition(async () => {
            const fd = new FormData();
            fd.set("id", id);
            await deleteTodo(fd);
            router.refresh();
          });
        }}
      />
    </div>
  );
}
