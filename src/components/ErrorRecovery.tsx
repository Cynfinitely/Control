"use client";

import { useEffect, useRef } from "react";
import { isNetworkError } from "@/lib/network-error";

const RECOVER_KEY = "control-network-recover-at";
const RECOVER_COOLDOWN_MS = 10_000;

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
  homeHref: string;
  autoRecover?: "reset" | "reload";
};

export default function ErrorRecovery({ error, reset, homeHref, autoRecover }: Props) {
  const network = isNetworkError(error);
  const tried = useRef(false);

  useEffect(() => {
    console.error(error);
    if (!network || !autoRecover || tried.current || !canAutoRecover()) return;
    tried.current = true;
    markRecovered();
    const timer = setTimeout(() => {
      if (autoRecover === "reload") {
        window.location.reload();
        return;
      }
      reset();
    }, 800);
    return () => clearTimeout(timer);
  }, [error, network, autoRecover, reset]);

  return (
    <div className="card mx-auto max-w-md text-center">
      <h2 className="section-title">{network ? "Connection lost" : "Something went wrong"}</h2>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        {network
          ? "The app couldn't reach the server. Check your network and try again."
          : "An unexpected error occurred. You can try again or return to the dashboard."}
      </p>
      <div className="mt-5 flex justify-center gap-2">
        <button type="button" onClick={reset} className="btn-primary">
          Try again
        </button>
        <a href={homeHref} className="btn-ghost">
          Go home
        </a>
      </div>
    </div>
  );
}

function canAutoRecover() {
  try {
    const last = Number(sessionStorage.getItem(RECOVER_KEY) || 0);
    return Date.now() - last > RECOVER_COOLDOWN_MS;
  } catch {
    return true;
  }
}

function markRecovered() {
  try {
    sessionStorage.setItem(RECOVER_KEY, String(Date.now()));
  } catch {
    // ignore quota / private mode
  }
}
