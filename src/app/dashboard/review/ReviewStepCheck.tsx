"use client";

import { useOptimistic, useTransition } from "react";
import clsx from "clsx";
import CheckButton from "@/components/CheckButton";
import { useToast } from "@/components/Toast";
import { toggleReviewStep } from "./actions";

type Props = {
  weekKey: string;
  step: string;
  title: string;
  done: boolean;
};

/** Per-step "Done" checkbox; flips instantly and rolls back on error. */
export default function ReviewStepCheck({ weekKey, step, title, done }: Props) {
  const [optimisticDone, setOptimisticDone] = useOptimistic(done);
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  function toggle() {
    const next = !optimisticDone;
    startTransition(async () => {
      setOptimisticDone(next);
      const fd = new FormData();
      fd.set("weekKey", weekKey);
      fd.set("step", step);
      fd.set("done", next ? "1" : "0");
      try {
        const result = await toggleReviewStep(fd);
        if (!result.ok) toast.error(result.error);
      } catch {
        toast.error("Couldn't save — try again");
      }
    });
  }

  return (
    <div className="flex shrink-0 items-center gap-2">
      <CheckButton
        checked={optimisticDone}
        onChange={toggle}
        disabled={pending}
        label={optimisticDone ? `Mark “${title}” not done` : `Mark “${title}” done`}
      />
      <span
        aria-hidden="true"
        className={clsx(
          "text-sm font-medium",
          optimisticDone ? "text-brand-700 dark:text-brand-400" : "text-muted"
        )}
      >
        {optimisticDone ? "Done" : "Mark done"}
      </span>
    </div>
  );
}
