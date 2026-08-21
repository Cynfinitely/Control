"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFormState } from "react-dom";
import Icon from "@/components/Icon";
import SubmitButton from "@/components/SubmitButton";
import { useToast } from "@/components/Toast";
import { markPrinciplesReviewedForm } from "@/app/dashboard/principles/actions";

type Props = {
  reviewedToday: boolean;
  compact?: boolean;
};

export default function PrincipleReviewCard({ reviewedToday, compact = false }: Props) {
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

  const wrap = compact ? "card py-4" : "card mb-6";

  if (reviewedToday) {
    return (
      <div className={`${wrap} border-l-4 border-l-green-500`}>
        <div className="flex items-start gap-3">
          <Icon name="shield" className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
              Principles reviewed
            </p>
            <Link href="/dashboard/principles" className="mt-1 inline-flex text-xs text-brand-600 hover:underline">
              Open principles
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${wrap} border-l-4 border-l-slate-400`}>
      <div className="flex items-start gap-3">
        <Icon name="shield" className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
        <div className="min-w-0 flex-1">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Review your principles when you can — one soft check for the day.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Link href="/dashboard/principles" className="btn-ghost text-xs">
              Review principles
            </Link>
            <form action={formAction}>
              <SubmitButton className="btn-primary text-xs">Mark reviewed</SubmitButton>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
