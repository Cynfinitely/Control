"use client";

import "./globals.css";
import ErrorRecovery from "@/components/ErrorRecovery";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen items-center justify-center p-4">
          <ErrorRecovery
            error={error}
            reset={() => {
              reset();
              window.location.reload();
            }}
            homeHref="/dashboard"
            autoRecover="reload"
          />
        </div>
      </body>
    </html>
  );
}
