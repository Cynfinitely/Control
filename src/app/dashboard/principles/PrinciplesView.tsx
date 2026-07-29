"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import FormAction from "@/components/FormAction";
import SubmitButton from "@/components/SubmitButton";
import DeleteConfirmButton from "@/components/DeleteConfirmButton";
import type { PrincipleItem } from "@/lib/queries/principles";
import {
  PRINCIPLE_CATEGORY_LABELS,
  PRINCIPLE_CATEGORY_ORDER,
  type PrincipleCategory,
} from "@/lib/principles/seed";
import { archivePrinciple, createPrincipleForm, updatePrincipleForm } from "./actions";
import PrinciplesReviewButton from "./PrinciplesReviewButton";

type Props = {
  principles: PrincipleItem[];
  reviewedToday: boolean;
};

type ListRow =
  | { kind: "category"; category: string; label: string }
  | { kind: "item"; item: PrincipleItem; index: number };

export default function PrinciplesView({ principles, reviewedToday }: Props) {
  const [mode, setMode] = useState<"read" | "manage">("read");
  const [query, setQuery] = useState("");
  const [, startTransition] = useTransition();
  const router = useRouter();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return principles;
    return principles.filter(
      (p) =>
        p.text.toLowerCase().includes(q) ||
        (PRINCIPLE_CATEGORY_LABELS[p.category as PrincipleCategory] ?? p.category)
          .toLowerCase()
          .includes(q)
    );
  }, [principles, query]);

  /** Single ordered stream with light category markers when the group changes. */
  const readRows = useMemo(() => {
    const rows: ListRow[] = [];
    let lastCategory = "";
    let index = 0;
    const sorted = [...filtered].sort((a, b) => {
      const ai = PRINCIPLE_CATEGORY_ORDER.indexOf(a.category as PrincipleCategory);
      const bi = PRINCIPLE_CATEGORY_ORDER.indexOf(b.category as PrincipleCategory);
      const aCat = ai === -1 ? 99 : ai;
      const bCat = bi === -1 ? 99 : bi;
      if (aCat !== bCat) return aCat - bCat;
      return a.sortOrder - b.sortOrder;
    });
    for (const item of sorted) {
      if (item.category !== lastCategory) {
        lastCategory = item.category;
        rows.push({
          kind: "category",
          category: item.category,
          label:
            PRINCIPLE_CATEGORY_LABELS[item.category as PrincipleCategory] ?? item.category,
        });
      }
      index += 1;
      rows.push({ kind: "item", item, index });
    }
    return rows;
  }, [filtered]);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1 sm:max-w-md">
          <label htmlFor="principles-search" className="sr-only">
            Search principles
          </label>
          <input
            id="principles-search"
            type="search"
            className="input"
            placeholder="Search principles…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {mode === "read" &&
            (reviewedToday ? (
              <span className="text-sm font-medium text-green-600 dark:text-green-400">
                Reviewed today ✓
              </span>
            ) : (
              <PrinciplesReviewButton />
            ))}
          <button
            type="button"
            className="btn-ghost text-sm"
            onClick={() => setMode((m) => (m === "read" ? "manage" : "read"))}
          >
            {mode === "read" ? "Manage" : "Done"}
          </button>
        </div>
      </div>

      {mode === "read" ? (
        filtered.length === 0 ? (
          <p className="text-sm text-slate-500">No principles match your search.</p>
        ) : (
          <article className="mx-auto max-w-2xl">
            {readRows.map((row, i) =>
              row.kind === "category" ? (
                <h2
                  key={`cat-${row.category}`}
                  className={`text-xs font-semibold uppercase tracking-wide text-slate-400 ${
                    i === 0 ? "mb-2" : "mb-2 mt-8"
                  }`}
                >
                  {row.label}
                </h2>
              ) : (
                <div
                  key={row.item.id}
                  className="flex gap-3 border-b border-slate-100 py-3 last:border-b-0 dark:border-slate-800"
                >
                  <span className="w-7 shrink-0 pt-0.5 text-right text-sm tabular-nums text-slate-400">
                    {row.index}
                  </span>
                  <p className="text-[15px] leading-relaxed text-slate-800 dark:text-slate-100">
                    {row.item.text}
                  </p>
                </div>
              )
            )}
          </article>
        )
      ) : (
        <div className="space-y-6">
          <FormAction
            action={createPrincipleForm}
            successMessage="Principle added"
            className="card space-y-3"
          >
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Add principle
            </p>
            <div>
              <label htmlFor="principle-text" className="label">
                Text
              </label>
              <textarea
                id="principle-text"
                name="text"
                className="input"
                rows={2}
                placeholder="A principle or guardrail…"
                required
              />
            </div>
            <div>
              <label htmlFor="principle-category" className="label">
                Category
              </label>
              <select
                id="principle-category"
                name="category"
                className="input"
                required
                defaultValue="environment"
              >
                {PRINCIPLE_CATEGORY_ORDER.map((cat) => (
                  <option key={cat} value={cat}>
                    {PRINCIPLE_CATEGORY_LABELS[cat]}
                  </option>
                ))}
              </select>
            </div>
            <SubmitButton className="btn-primary">Add principle</SubmitButton>
          </FormAction>

          {filtered.length === 0 ? (
            <p className="text-sm text-slate-500">No principles match your search.</p>
          ) : (
            <div className="space-y-2">
              {filtered.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-slate-200 p-3 dark:border-slate-700"
                >
                  <p className="text-sm text-slate-700 dark:text-slate-200">{item.text}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {PRINCIPLE_CATEGORY_LABELS[item.category as PrincipleCategory] ??
                      item.category}
                  </p>
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-brand-600">Edit</summary>
                    <FormAction
                      action={updatePrincipleForm}
                      successMessage="Principle updated"
                      className="mt-3 space-y-3"
                    >
                      <input type="hidden" name="id" value={item.id} />
                      <div>
                        <label htmlFor={`principle-text-${item.id}`} className="label">
                          Text
                        </label>
                        <textarea
                          id={`principle-text-${item.id}`}
                          name="text"
                          className="input"
                          rows={3}
                          required
                          defaultValue={item.text}
                        />
                      </div>
                      <div>
                        <label htmlFor={`principle-category-${item.id}`} className="label">
                          Category
                        </label>
                        <select
                          id={`principle-category-${item.id}`}
                          name="category"
                          className="input"
                          defaultValue={item.category}
                          required
                        >
                          {PRINCIPLE_CATEGORY_ORDER.map((cat) => (
                            <option key={cat} value={cat}>
                              {PRINCIPLE_CATEGORY_LABELS[cat]}
                            </option>
                          ))}
                        </select>
                      </div>
                      <SubmitButton className="btn-primary">Save changes</SubmitButton>
                    </FormAction>
                  </details>
                  <div className="mt-2">
                    <DeleteConfirmButton
                      title="Archive principle?"
                      message="This principle will be hidden from your list. You can add it again later if needed."
                      label="Archive"
                      className="text-xs text-slate-400 hover:text-red-500"
                      onConfirm={() => {
                        startTransition(async () => {
                          const fd = new FormData();
                          fd.set("id", item.id);
                          await archivePrinciple(fd);
                          router.refresh();
                        });
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
