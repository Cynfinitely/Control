"use client";

import ErrorRecovery from "@/components/ErrorRecovery";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorRecovery error={error} reset={reset} homeHref="/dashboard" autoRecover="reset" />;
}
