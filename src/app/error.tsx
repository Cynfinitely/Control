"use client";

import ErrorRecovery from "@/components/ErrorRecovery";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-4">
      <ErrorRecovery error={error} reset={reset} homeHref="/dashboard" autoRecover="reset" />
    </div>
  );
}
