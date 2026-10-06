"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import ModulePicker from "@/components/ModulePicker";
import Spinner from "@/components/Spinner";
import { useToast } from "@/components/Toast";
import { useUnsavedChangesWarning } from "@/lib/use-unsaved-changes";
import type { ModuleId } from "@/lib/modules";
import { saveModules } from "./actions";

export default function ModulesForm({ disabled }: { disabled: ModuleId[] }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [selection, setSelection] = useState<ModuleId[]>(disabled);
  const dirty = selection.join(",") !== disabled.join(",");
  useUnsavedChangesWarning(dirty);

  function save() {
    startTransition(async () => {
      const res = await saveModules(selection);
      if (res.ok) {
        toast.success(res.message ?? "Saved");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <section id="modules" className="card scroll-mt-20 space-y-4" aria-labelledby="modules-title">
      <div>
        <h2 id="modules-title" className="section-title">
          Modules
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Switch off the parts of Control you don&apos;t use. A module that is off disappears from the menu, search,
          Home, Review and Reports. Its data is kept, so you can switch it back on at any time and carry on where you
          left off.
        </p>
      </div>
      <ModulePicker disabled={selection} onChange={setSelection} busy={pending} />
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="btn-primary" onClick={save} disabled={!dirty || pending}>
          {pending && <Spinner />}
          {pending ? "Saving…" : "Save modules"}
        </button>
        {dirty && !pending && (
          <button type="button" className="btn-ghost" onClick={() => setSelection(disabled)}>
            Discard changes
          </button>
        )}
      </div>
    </section>
  );
}
