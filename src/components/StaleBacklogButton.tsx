"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useFormState } from "react-dom";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useToast } from "@/components/Toast";
import { moveAllStaleToBacklogForm } from "@/app/dashboard/todos/actions";

type Props = {
  count: number;
  className?: string;
};

export default function StaleBacklogButton({ count, className = "btn-ghost text-xs" }: Props) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState(moveAllStaleToBacklogForm, null);
  const [, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const { success, error } = useToast();

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      success(state.message ?? "Moved to backlog");
    } else {
      error(state.error);
    }
  }, [state, success, error]);

  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        Move all past open to backlog ({count})
      </button>
      <form
        ref={formRef}
        className="hidden"
        action={(fd) => startTransition(() => formAction(fd))}
      />
      <ConfirmDialog
        open={open}
        title="Move past todos to backlog?"
        message={`${count} open todo${count === 1 ? "" : "s"} from previous days will leave their day lists and appear in your backlog. Today's todos are not affected.`}
        confirmLabel="Move to backlog"
        variant="default"
        onConfirm={() => {
          setOpen(false);
          formRef.current?.requestSubmit();
        }}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
