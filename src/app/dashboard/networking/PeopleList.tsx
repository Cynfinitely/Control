"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatDaysAgo } from "@/lib/date";
import { relationshipLabel, isPersonalRelationship } from "@/lib/contacts";
import type { PersonRow } from "@/lib/queries/networking";

export default function PeopleList({ people }: { people: PersonRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return people;
    return people.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.org ?? "").toLowerCase().includes(q) ||
        (p.role ?? "").toLowerCase().includes(q) ||
        (p.tags ?? "").toLowerCase().includes(q)
    );
  }, [people, query]);

  return (
    <div>
      <input
        className="input mb-4"
        placeholder="Search people"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {filtered.length === 0 ? (
        <p className="text-sm text-slate-400">No people match.</p>
      ) : (
        <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white dark:divide-slate-700 dark:border-slate-700 dark:bg-slate-800">
          {filtered.map((p) => {
            const relLabel = relationshipLabel(p.relationship);
            const showWork = !isPersonalRelationship(p.relationship) && (p.role || p.org);
            return (
              <Link
                key={p.id}
                href={`/dashboard/networking/${p.id}`}
                className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50"
              >
                <div className="min-w-0">
                  <p className="font-medium text-slate-800 dark:text-slate-100">{p.name}</p>
                  <p className="truncate text-xs text-slate-400">
                    {showWork
                      ? [p.role, p.org].filter(Boolean).join(" · ")
                      : relLabel ?? "Person"}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {p.overdue && (
                    <span className="badge bg-amber-100 text-amber-700">
                      {p.lastTouch ? `${p.touchCadenceDays ?? 30}d+ silent` : "no contact"}
                    </span>
                  )}
                  <span className="text-xs text-slate-500">
                    {p.lastTouch ? formatDaysAgo(p.lastTouch) : "Never"}
                    {p.lastTouchType && p.lastTouchType !== "call" ? ` · ${p.lastTouchType}` : ""}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
