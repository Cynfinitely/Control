"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="card mx-auto max-w-md text-center">
      <h2 className="section-title">Something went wrong</h2>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        An unexpected error occurred. You can try again or return to the dashboard.
      </p>
      <div className="mt-5 flex justify-center gap-2">
        <button type="button" onClick={reset} className="btn-primary">
          Try again
        </button>
        <Link href="/dashboard" className="btn-ghost">
          Go home
        </Link>
      </div>
    </div>
  );
}
