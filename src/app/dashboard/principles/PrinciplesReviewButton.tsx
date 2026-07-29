"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFormState } from "react-dom";
import SubmitButton from "@/components/SubmitButton";
import { useToast } from "@/components/Toast";
import { markPrinciplesReviewedForm } from "./actions";

export default function PrinciplesReviewButton() {
  const router = useRouter();
  const { success, error } = useToast();
  const [state, formAction] = useFormState(markPrinciplesReviewedForm, null);

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      success(state.message ?? "Marked as reviewed");
      router.refresh();
    } else {
      error(state.error);
    }
  }, [state, success, error, router]);

  return (
    <form action={formAction}>
      <SubmitButton className="btn-primary">Mark reviewed</SubmitButton>
    </form>
  );
}
