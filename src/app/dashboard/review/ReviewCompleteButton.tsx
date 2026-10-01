"use client";

import ActionForm from "@/components/ActionForm";
import SubmitButton from "@/components/SubmitButton";
import { completeReview, reopenReview } from "./actions";

type Props = {
  weekKey: string;
  completed: boolean;
  remaining: number;
};

export default function ReviewCompleteButton({ weekKey, completed, remaining }: Props) {
  if (completed) {
    return (
      <ActionForm action={reopenReview} successMessage="Review reopened">
        <input type="hidden" name="weekKey" value={weekKey} />
        <SubmitButton className="btn-ghost">Reopen review</SubmitButton>
      </ActionForm>
    );
  }

  return (
    <ActionForm
      action={completeReview}
      successMessage="Weekly review complete"
      confirm={
        remaining > 0
          ? {
              title: `Complete with ${remaining} step${remaining === 1 ? "" : "s"} open?`,
              message: "You can still tick them off afterwards, or reopen the review.",
              confirmLabel: "Complete anyway",
              variant: "default",
            }
          : undefined
      }
    >
      <input type="hidden" name="weekKey" value={weekKey} />
      <SubmitButton className="btn-primary">Complete review</SubmitButton>
    </ActionForm>
  );
}
