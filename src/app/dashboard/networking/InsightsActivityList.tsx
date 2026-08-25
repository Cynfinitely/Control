"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatDaysAgo } from "@/lib/date";
import {
  INTERACTION_TYPES,
  INTERACTION_TYPE_LABELS,
  parseTopics,
} from "@/lib/networking";
import type { ActivityItem } from "@/lib/queries/networking";

export default function InsightsActivityList({ items }: { items: ActivityItem[] }) {
  const [type, setType] = useState("all");
  const [person, setPerson] = useState("all");
  const [topic, setTopic] = useState("all");

  const people = useMemo(() => {
    const map = new Map<string, string>();
    for (const it of items) map.set(it.contactId, it.contactName);
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [items]);

  const topics = useMemo(() => {
    const set = new Set<string>();
    for (const it of items) {
      for (const t of parseTopics(it.topics)) set.add(t);
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [items]);

  const filtered = items.filter((it) => {
    if (type !== "all" && it.type !== type) return false;
    if (person !== "all" && it.contactId !== person) return false;
    if (topic !== "all" && !parseTopics(it.topics).some((t) => t.toLowerCase() === topic.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="card">
      <h2 className="section-title mb-3">Activity</h2>
      <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <select className="input" value={type} onChange={(e) => setType(e.target.value)} aria-label="Filter by type">
          <option value="all">All types</option>
          {INTERACTION_TYPES.map((t) => (
            <option key={t} value={t}>
              {INTERACTION_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
        <select className="input" value={person} onChange={(e) => setPerson(e.target.value)} aria-label="Filter by person">
          <option value="all">All people</option>
          {people.map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
        <select className="input" value={topic} onChange={(e) => setTopic(e.target.value)} aria-label="Filter by topic">
          <option value="all">All topics</option>
          {topics.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      {filtered.length === 0 ? (
        <p className="text-sm text-slate-400">No logs in this period.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((it) => (
            <div key={it.id} className="flex items-start justify-between gap-3 border-t border-slate-100 pt-2 text-sm dark:border-slate-700">
              <div>
                <Link href={`/dashboard/networking/${it.contactId}`} className="font-medium text-slate-800 hover:underline dark:text-slate-100">
                  {it.contactName}
                </Link>
                <span className="text-slate-400"> · {INTERACTION_TYPE_LABELS[it.type] ?? it.type}</span>
                {it.summary && <p className="text-slate-600 dark:text-slate-300">{it.summary}</p>}
                {parseTopics(it.topics).length > 0 && (
                  <p className="text-xs text-slate-400">{parseTopics(it.topics).join(" · ")}</p>
                )}
              </div>
              <span className="shrink-0 text-xs text-slate-400">{formatDaysAgo(it.date)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
