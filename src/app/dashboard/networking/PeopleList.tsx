"use client";

import { useId, useMemo, useState } from "react";
import Link from "next/link";
import { formatDaysAgo } from "@/lib/date";
import { relationshipLabel, isPersonalRelationship } from "@/lib/contacts";
import EmptyState from "@/components/EmptyState";
import type { PersonRow } from "@/lib/queries/networking";

export default function PeopleList({ people }: { people: PersonRow[] }) {
  const [query, setQuery] = useState("");
  const searchId = useId();

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
      <div className="mb-4">
        <label htmlFor={searchId} className="label">
          Search people
        </label>
        <input
          id={searchId}
          type="search"
          className="input"
          placeholder="Name, organisation, role or tag"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      {filtered.length === 0 ? (
        <EmptyState
          variant="inline"
          icon="search"
          title={query.trim() ? `No people match “${query.trim()}”` : "No people in this group"}
          description={query.trim() ? "Try a different name, organisation or tag." : undefined}
          onAction={query.trim() ? () => setQuery("") : undefined}
          actionLabel={query.trim() ? "Clear search" : undefined}
        />
      ) : (
        <div className="card-flush divide-y divide-slate-100 dark:divide-slate-700">
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
                  <p className="truncate text-xs text-muted">
                    {showWork
                      ? [p.role, p.org].filter(Boolean).join(" · ")
                      : relLabel ?? "Person"}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {p.overdue && (
                    <span className="badge-warning">
                      {p.lastTouch ? `${p.touchCadenceDays ?? 30}d+ silent` : "no contact"}
                    </span>
                  )}
                  <span className="text-xs text-slate-500 dark:text-slate-400">
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
