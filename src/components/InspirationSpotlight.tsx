"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Icon from "@/components/Icon";
import EmptyState from "@/components/EmptyState";
import type { InspirationItem } from "@/lib/queries/inspirations";

type Props = {
  items: InspirationItem[];
};

function pickRandom(items: InspirationItem[], excludeId?: string): InspirationItem {
  const pool = excludeId && items.length > 1 ? items.filter((i) => i.id !== excludeId) : items;
  return pool[Math.floor(Math.random() * pool.length)];
}

/** A random saved inspiration. The card reserves its height so the quote doesn't shift the page in. */
export default function InspirationSpotlight({ items }: Props) {
  const [current, setCurrent] = useState<InspirationItem | null>(null);

  useEffect(() => {
    setCurrent(items.length > 0 ? pickRandom(items) : null);
  }, [items]);

  const shuffle = useCallback(() => {
    if (items.length === 0) return;
    setCurrent((prev) => pickRandom(items, prev?.id));
  }, [items]);

  if (items.length === 0) {
    return (
      <section className="card" aria-label="Inspiration">
        <EmptyState
          variant="inline"
          headingLevel="h2"
          icon="sparkles"
          title="Add an inspiration"
          description="Save a quote or note that motivates you — one will appear here each visit."
          actionLabel="Add inspirations"
          actionHref="/dashboard/inspirations"
        />
      </section>
    );
  }

  return (
    <section className="card flex min-h-[9.5rem] items-start gap-3" aria-label="Inspiration">
      <Icon name="sparkles" className="mt-0.5 h-5 w-5 shrink-0 text-brand-500" />
      <div className="flex min-w-0 flex-1 flex-col self-stretch">
        {current ? (
          <figure aria-live="polite">
            <blockquote className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">
              &ldquo;{current.text}&rdquo;
            </blockquote>
            {current.author && <figcaption className="mt-1 text-xs text-muted">— {current.author}</figcaption>}
          </figure>
        ) : (
          <div aria-hidden="true" className="space-y-2">
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-3/4" />
            <div className="skeleton h-3 w-24" />
          </div>
        )}
        <div className="mt-auto flex flex-wrap gap-2 pt-3">
          {items.length > 1 && (
            <button type="button" onClick={shuffle} className="btn-ghost btn-sm min-h-[40px]">
              Another
            </button>
          )}
          <Link href="/dashboard/inspirations" className="btn-ghost btn-sm min-h-[40px]">
            Manage
          </Link>
        </div>
      </div>
    </section>
  );
}
