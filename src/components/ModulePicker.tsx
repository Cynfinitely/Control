"use client";

import Icon from "@/components/Icon";
import Switch from "@/components/Switch";
import { MODULE_SECTIONS, MODULES, type ModuleId } from "@/lib/modules";

type Props = {
  /** Modules currently switched off. */
  disabled: readonly ModuleId[];
  onChange: (next: ModuleId[]) => void;
  /** Disables every control, e.g. while saving. */
  busy?: boolean;
};

/**
 * Module on/off list grouped like the sidebar. Used in Settings and in
 * first-run setup. Controlled: the parent owns the list and decides when to save.
 */
export default function ModulePicker({ disabled, onChange, busy }: Props) {
  const off = new Set<ModuleId>(disabled);
  const enabledCount = MODULES.length - off.size;

  function toggle(id: ModuleId, on: boolean) {
    const next = new Set(off);
    if (on) next.delete(id);
    else next.add(id);
    onChange(MODULES.filter((m) => next.has(m.id)).map((m) => m.id));
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted" aria-live="polite">
          {enabledCount} of {MODULES.length} modules on
        </p>
        <div className="flex gap-2">
          <button type="button" className="btn-ghost btn-sm" disabled={busy || off.size === 0} onClick={() => onChange([])}>
            Turn all on
          </button>
          <button
            type="button"
            className="btn-ghost btn-sm"
            disabled={busy || enabledCount === 0}
            onClick={() => onChange(MODULES.map((m) => m.id))}
          >
            Turn all off
          </button>
        </div>
      </div>

      <div className="space-y-5">
        {MODULE_SECTIONS.map((section) => (
          <fieldset key={section}>
            <legend className="eyebrow mb-1">{section}</legend>
            <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 dark:divide-slate-700 dark:border-slate-700">
              {MODULES.filter((m) => m.section === section).map((m) => {
                const on = !off.has(m.id);
                return (
                  <li key={m.id} className="flex items-center gap-3 px-3 py-2.5">
                    <Icon
                      name={m.icon}
                      className={on ? "h-5 w-5 shrink-0 text-brand-600 dark:text-brand-400" : "h-5 w-5 shrink-0 text-slate-400 dark:text-slate-500"}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                        {m.label}
                        {!on && <span className="ml-2 text-xs font-normal text-muted">Off</span>}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">{m.description}</p>
                    </div>
                    <Switch checked={on} onChange={(next) => toggle(m.id, next)} label={`${m.label} module`} disabled={busy} />
                  </li>
                );
              })}
            </ul>
          </fieldset>
        ))}
      </div>
    </div>
  );
}
