"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Icon from "@/components/Icon";
import type { InspirationItem } from "@/lib/queries/inspirations";

type Props = {
  items: InspirationItem[];
};

function pickRandom(items: InspirationItem[], excludeId?: string): InspirationItem {
  const pool = excludeId && items.length > 1 ? items.filter((i) => i.id !== excludeId) : items;
  return pool[Math.floor(Math.random() * pool.length)];
}

export default function InspirationSpotlight({ items }: Props) {
  const [current, setCurrent] = useState<InspirationItem | null>(null);

  useEffect(() => {
    if (items.length > 0) {
      setCurrent(pickRandom(items));
    }
  }, [items]);

  const shuffle = useCallback(() => {
    if (items.length === 0) return;
    setCurrent((prev) => pickRandom(items, prev?.id));
  }, [items]);

  if (items.length === 0) {
    return (
      <div className="card mb-6 border-l-4 border-l-brand-400">
        <div className="flex items-start gap-3">
          <Icon name="sparkles" className="mt-0.5 h-5 w-5 shrink-0 text-brand-500" />
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Add a quote or note that motivates you — it will appear here when you need inspiration.
            </p>
            <Link href="/dashboard/inspirations" className="btn-ghost mt-3 inline-flex text-xs">
              Add inspirations
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!current) return null;

  return (
    <div className="card mb-6 border-l-4 border-l-brand-400">
      <div className="flex items-start gap-3">
        <Icon name="sparkles" className="mt-1 h-5 w-5 shrink-0 text-brand-500" />
        <div className="min-w-0 flex-1">
          <p className="text-lg leading-relaxed text-slate-800 dark:text-slate-100">
            &ldquo;{current.text}&rdquo;
          </p>
          {current.author && (
            <p className="mt-2 text-sm text-slate-500">— {current.author}</p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {items.length > 1 && (
              <button type="button" onClick={shuffle} className="btn-ghost text-xs">
                Another one
              </button>
            )}
            <Link href="/dashboard/inspirations" className="btn-ghost text-xs">
              Manage inspirations
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
