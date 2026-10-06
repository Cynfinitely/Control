"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Icon from "@/components/Icon";
import SlideOver from "@/components/SlideOver";
import { HELP, type HelpEntry, type HelpKey } from "@/lib/help";

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 first:mt-0">
      <h3 className="subsection-title mb-2">{title}</h3>
      {children}
    </section>
  );
}

/**
 * The "?" next to a page title. Opens a guide for the page: what it is for,
 * how to use it, everything it can do, and tips. Also opens with the ? key.
 */
export default function PageHelp({ topic }: { topic: HelpKey }) {
  const [open, setOpen] = useState(false);
  const entry: HelpEntry = HELP[topic];

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "?" || e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTypingTarget(e.target) || document.querySelector("dialog[open]")) return;
      e.preventDefault();
      setOpen(true);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-icon -my-1.5 shrink-0 text-slate-500 hover:text-brand-700 dark:text-slate-400 dark:hover:text-brand-300"
        aria-label={`How this page works: ${entry.title}`}
        aria-haspopup="dialog"
        aria-keyshortcuts="?"
        title="How this page works (?)"
      >
        <Icon name="help" className="h-5 w-5" />
      </button>

      <SlideOver open={open} onClose={() => setOpen(false)} title={entry.title} eyebrow="Page guide">
        <Section title="What this page is for">
          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">{entry.purpose}</p>
        </Section>

        <Section title="How to use it">
          <ol className="space-y-2.5">
            {entry.steps.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                <span
                  aria-hidden="true"
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold tabular-nums text-brand-700 dark:bg-brand-950 dark:text-brand-300"
                >
                  {i + 1}
                </span>
                <span className="min-w-0 pt-0.5">
                  <span className="sr-only">Step {i + 1}: </span>
                  {step}
                </span>
              </li>
            ))}
          </ol>
        </Section>

        <Section title="What you can do here">
          <ul className="space-y-2">
            {entry.capabilities.map((capability, i) => (
              <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                <Icon name="check" className="mt-1 h-3.5 w-3.5 shrink-0 text-brand-600 dark:text-brand-400" />
                <span className="min-w-0">{capability}</span>
              </li>
            ))}
          </ul>
        </Section>

        {entry.tips && entry.tips.length > 0 && (
          <Section title="Good to know">
            <ul className="space-y-2 rounded-lg bg-slate-50 p-3 dark:bg-slate-900/50">
              {entry.tips.map((tip, i) => (
                <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                  <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" />
                  <span className="min-w-0">{tip}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {entry.related && entry.related.length > 0 && (
          <Section title="Related pages">
            <ul className="flex flex-wrap gap-2">
              {entry.related.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} onClick={() => setOpen(false)} className="btn-ghost btn-sm min-h-[40px]">
                    {link.label}
                    <Icon name="arrowRight" className="h-3.5 w-3.5" />
                  </Link>
                </li>
              ))}
            </ul>
          </Section>
        )}

        <p className="mt-6 border-t border-slate-100 pt-4 text-xs text-muted dark:border-slate-700">
          Press <kbd className="rounded bg-slate-100 px-1.5 py-0.5 font-sans text-slate-700 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700">?</kbd>{" "}
          on any page to open its guide. Modules can be switched on and off in Settings.
        </p>
      </SlideOver>
    </>
  );
}
