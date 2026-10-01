"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import ActionForm from "@/components/ActionForm";
import SubmitButton from "@/components/SubmitButton";
import { markPrinciplesReviewed } from "@/app/dashboard/principles/actions";

type Props = {
  reviewedToday: boolean;
};

export default function PrincipleReviewCard({ reviewedToday }: Props) {
  const router = useRouter();

  if (reviewedToday) {
    return (
      <section className="card flex items-start gap-3" aria-label="Principles">
        <Icon name="shield" className="mt-0.5 h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-100">
            Principles
            <span className="badge-success">
              <Icon name="check" className="h-3 w-3" />
              Reviewed today
            </span>
          </p>
          <Link href="/dashboard/principles" className="btn-ghost btn-sm mt-3 min-h-[40px]">
            Open principles
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="card flex items-start gap-3" aria-label="Principles">
      <Icon name="shield" className="mt-0.5 h-5 w-5 shrink-0 text-slate-500 dark:text-slate-400" />
      <div className="min-w-0 flex-1">
        <p className="text-sm text-slate-700 dark:text-slate-300">
          Review your principles when you can — one soft check for the day.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <ActionForm
            action={markPrinciplesReviewed}
            successMessage="Marked as reviewed"
            onSuccess={() => router.refresh()}
          >
            <SubmitButton className="btn-primary btn-sm min-h-[40px]">Mark reviewed</SubmitButton>
          </ActionForm>
          <Link href="/dashboard/principles" className="btn-ghost btn-sm min-h-[40px]">
            Read principles
          </Link>
        </div>
      </div>
    </section>
  );
}
