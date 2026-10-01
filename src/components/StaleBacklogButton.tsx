"use client";

import ActionForm from "@/components/ActionForm";
import SubmitButton from "@/components/SubmitButton";
import { moveAllStaleToBacklog } from "@/app/dashboard/todos/actions";

type Props = {
  count: number;
  className?: string;
};

/** Moves every open todo from previous days into the backlog (after a confirm). */
export default function StaleBacklogButton({ count, className = "btn-ghost btn-sm min-h-[40px]" }: Props) {
  const noun = count === 1 ? "todo" : "todos";
  return (
    <ActionForm
      action={moveAllStaleToBacklog}
      confirm={{
        title: "Move past todos to backlog?",
        message: `${count} open ${noun} from previous days will leave their day lists and appear in your backlog. Today's todos are not affected.`,
        confirmLabel: "Move to backlog",
        variant: "default",
      }}
    >
      <SubmitButton className={className} pendingLabel="Moving…">
        Move {count} old {noun} to backlog
      </SubmitButton>
    </ActionForm>
  );
}
