"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import ActionForm from "@/components/ActionForm";
import SubmitButton from "@/components/SubmitButton";
import IconButton from "@/components/IconButton";
import { useToast } from "@/components/Toast";
import { deleteTodo, pullFromBacklog, restoreTodo } from "./actions";

type Props = {
  id: string;
  title: string;
  dayValue: string;
  /** "today", "yesterday" or a formatted date — used in "Add to {day}". */
  dayName: string;
};

export default function BacklogRow({ id, title, dayValue, dayName }: Props) {
  const [pending, startTransition] = useTransition();
  const [hidden, setHidden] = useState(false);
  const router = useRouter();
  const { success, error } = useToast();

  function handleDelete() {
    setHidden(true);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", id);
      const res = await deleteTodo(fd).catch(() => null);
      if (!res?.ok) {
        setHidden(false);
        error(res && !res.ok ? res.error : "Couldn't delete — try again");
        return;
      }
      router.refresh();
      success("Backlog item deleted", {
        label: "Undo",
        onClick: () => {
          startTransition(async () => {
            const restoreFd = new FormData();
            restoreFd.set("id", id);
            const restored = await restoreTodo(restoreFd);
            setHidden(false);
            router.refresh();
            if (restored.ok) success("Todo restored");
            else error(restored.error);
          });
        },
      });
    });
  }

  if (hidden) return null;

  return (
    <li className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:gap-3">
      <span className="min-w-0 flex-1 break-words text-slate-800 dark:text-slate-100">{title}</span>
      <div className="flex shrink-0 items-center gap-1">
        <ActionForm action={pullFromBacklog}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="dayDate" value={dayValue} />
          <SubmitButton className="btn-ghost btn-sm min-h-[40px]" disabled={pending}>
            Add to {dayName}
          </SubmitButton>
        </ActionForm>
        <IconButton
          icon="trash"
          tone="danger"
          disabled={pending}
          onClick={handleDelete}
          aria-label={`Delete “${title}”`}
        />
      </div>
    </li>
  );
}
