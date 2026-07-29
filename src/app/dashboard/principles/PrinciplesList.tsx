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
import { archivePrinciple, updatePrincipleForm } from "./actions";

type Props = {
  principles: PrincipleItem[];
};

export default function PrinciplesList({ principles }: Props) {
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

  const grouped = useMemo(() => {
    const map = new Map<string, PrincipleItem[]>();
    for (const cat of PRINCIPLE_CATEGORY_ORDER) {
      map.set(cat, []);
    }
    for (const p of filtered) {
      const list = map.get(p.category) ?? [];
      list.push(p);
      map.set(p.category, list);
    }
    return PRINCIPLE_CATEGORY_ORDER.map((cat) => ({
      category: cat,
      label: PRINCIPLE_CATEGORY_LABELS[cat],
      items: map.get(cat) ?? [],
    })).filter((g) => g.items.length > 0);
  }, [filtered]);

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="principles-search" className="label">
          Search
        </label>
        <input
          id="principles-search"
          type="search"
          className="input"
          placeholder="Filter by text or category…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {grouped.length === 0 ? (
        <p className="text-sm text-slate-500">No principles match your search.</p>
      ) : (
        grouped.map((group) => (
          <section key={group.category}>
            <h2 className="section-title mb-3">{group.label}</h2>
            <div className="space-y-3">
              {group.items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-slate-200 p-4 dark:border-slate-700"
                >
                  <p className="text-slate-700 dark:text-slate-200">
                    <span className="mr-2 text-xs font-medium text-slate-400">
                      {item.sortOrder}.
                    </span>
                    {item.text}
                  </p>
                  <details className="mt-3">
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
          </section>
        ))
      )}
    </div>
  );
}
