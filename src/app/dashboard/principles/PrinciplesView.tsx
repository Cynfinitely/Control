"use client";

import { useMemo, useState } from "react";
import FormAction from "@/components/FormAction";
import ActionForm from "@/components/ActionForm";
import SubmitButton from "@/components/SubmitButton";
import SegmentedControl from "@/components/SegmentedControl";
import CollapsibleSection from "@/components/CollapsibleSection";
import EmptyState from "@/components/EmptyState";
import Icon from "@/components/Icon";
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
            principles.length > 0 &&
            (reviewedToday ? (
              <span className="badge-success py-1">
                <Icon name="check" className="h-3.5 w-3.5" /> Reviewed today
              </span>
            ) : (
              <PrinciplesReviewButton />
            ))}
          <SegmentedControl
            aria-label="Principles view"
            value={mode}
            onChange={setMode}
            options={[
              { value: "read", label: "Read" },
              { value: "manage", label: "Manage" },
            ]}
          />
        </div>
      </div>

      {mode === "read" ? (
        principles.length === 0 ? (
          <EmptyState
            icon="flag"
            title="No principles yet"
            description="Write down the guardrails you want to live by, then read them here."
            actionLabel="Add a principle"
            onAction={() => setMode("manage")}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            variant="inline"
            icon="search"
            title={`No principles match “${query.trim()}”`}
            actionLabel="Clear search"
            onAction={() => setQuery("")}
          />
        ) : (
          <article className="mx-auto max-w-2xl">
            {readRows.map((row, i) =>
              row.kind === "category" ? (
                <h2
                  key={`cat-${row.category}`}
                  className={`eyebrow ${i === 0 ? "mb-2" : "mb-2 mt-8"}`}
                >
                  {row.label}
                </h2>
              ) : (
                <div
                  key={row.item.id}
                  className="flex gap-3 border-b border-slate-100 py-3 last:border-b-0 dark:border-slate-800"
                >
                  <span className="w-7 shrink-0 pt-0.5 text-right text-sm tabular-nums text-muted">
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
            resetOnSuccess
            className="card space-y-3"
          >
            <h2 className="section-title">Add principle</h2>
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

          <section aria-labelledby="principles-manage-heading">
            <h2 id="principles-manage-heading" className="section-title mb-3">
              Your principles <span className="text-sm font-normal text-muted">({principles.length})</span>
            </h2>
            {filtered.length === 0 ? (
              <EmptyState
                variant="inline"
                headingLevel="h3"
                icon={principles.length === 0 ? "flag" : "search"}
                title={principles.length === 0 ? "No principles yet" : `No principles match “${query.trim()}”`}
                description={principles.length === 0 ? "Add your first one above." : undefined}
                actionLabel={principles.length === 0 ? undefined : "Clear search"}
                onAction={principles.length === 0 ? undefined : () => setQuery("")}
              />
            ) : (
              <ul className="card-flush divide-y divide-slate-100 dark:divide-slate-700">
                {filtered.map((item) => {
                  const categoryLabel =
                    PRINCIPLE_CATEGORY_LABELS[item.category as PrincipleCategory] ?? item.category;
                  return (
                    <li key={item.id} className="px-4 py-3">
                      <p className="text-sm text-slate-800 dark:text-slate-100">{item.text}</p>
                      <p className="mt-1 text-xs text-muted">{categoryLabel}</p>
                      <div className="mt-1 flex flex-wrap items-start justify-between gap-2">
                        <CollapsibleSection title="Edit" className="min-w-0 flex-1 text-sm">
                          <FormAction
                            action={updatePrincipleForm}
                            successMessage="Principle updated"
                            className="space-y-3"
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
                        </CollapsibleSection>
                        <ActionForm
                          action={archivePrinciple}
                          successMessage="Principle archived"
                          confirm={{
                            title: "Archive this principle?",
                            message: "It will be hidden from your list. You can add it again later if needed.",
                            confirmLabel: "Archive",
                          }}
                        >
                          <input type="hidden" name="id" value={item.id} />
                          <SubmitButton
                            className="btn-danger btn-sm min-h-[36px]"
                            aria-label={`Archive principle: ${item.text.slice(0, 60)}`}
                          >
                            <Icon name="trash" className="h-3.5 w-3.5" /> Archive
                          </SubmitButton>
                        </ActionForm>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
