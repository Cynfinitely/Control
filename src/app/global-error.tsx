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
      <head>
        <title>Something went wrong · Control</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <main className="flex min-h-screen items-center justify-center p-4">
          <ErrorRecovery
            error={error}
            reset={() => {
              reset();
              window.location.reload();
            }}
            homeHref="/dashboard"
            autoRecover="reload"
          />
        </main>
      </body>
    </html>
  );
}
