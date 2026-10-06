"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import ModulePicker from "@/components/ModulePicker";
import Icon from "@/components/Icon";
import Spinner from "@/components/Spinner";
import { MODULES, type ModuleId } from "@/lib/modules";
import { completeOnboarding } from "./actions";

export default function OnboardingForm({ name, disabled }: { name: string; disabled: ModuleId[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selection, setSelection] = useState<ModuleId[]>(disabled);
  const [error, setError] = useState("");
  const enabledCount = MODULES.length - selection.length;

  function finish() {
    setError("");
    startTransition(async () => {
      const res = await completeOnboarding(selection);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.replace("/dashboard");
      router.refresh();
    });
  }

  return (
    <div className="card">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
        {name ? `Welcome, ${name}` : "Welcome"}
      </h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        Control is made of modules, one for each part of life you might want to keep track of. Choose the ones you
        want to start with. Everything is on by default; switch off anything you don&apos;t need and it stays out of
        your way.
      </p>

      <div className="mt-4 flex items-start gap-2 rounded-lg bg-brand-50 px-3 py-2.5 text-sm text-brand-800 dark:bg-brand-950 dark:text-brand-200">
        <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          <strong className="font-semibold">You can change this at any time</strong> in Settings → Modules. Switching
          a module off later never deletes what you saved in it.
        </p>
      </div>

      <div className="mt-5">
        <ModulePicker disabled={selection} onChange={setSelection} busy={pending} />
      </div>

      <div className="mt-5 flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
        <Icon name="shield" className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Your account is private. It starts empty, and nobody else who uses Control can see what you add. On every
          page, the <span className="font-medium text-slate-800 dark:text-slate-200">?</span> button next to the
          title explains what the page is for and how to use it.
        </p>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">
          {enabledCount === 0
            ? "With every module off you will only have Home and Settings."
            : `Starting with ${enabledCount} module${enabledCount === 1 ? "" : "s"}.`}
        </p>
        <button type="button" className="btn-primary touch-target" onClick={finish} disabled={pending}>
          {pending && <Spinner />}
          {pending ? "Setting up…" : "Start using Control"}
        </button>
      </div>
    </div>
  );
}
