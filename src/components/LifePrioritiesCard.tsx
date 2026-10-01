import Link from "next/link";
import EmptyState from "@/components/EmptyState";
import type { LifePriorityItem } from "@/lib/queries/priorities";

type Props = {
  items: LifePriorityItem[];
};

export default function LifePrioritiesCard({ items }: Props) {
  return (
    <section className="card mb-6 border-l-4 border-l-brand-500" aria-labelledby="life-priorities-title">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 id="life-priorities-title" className="section-title">
            Life priorities
          </h2>
          <p className="mt-1 text-sm text-muted">What you serve first.</p>
        </div>
        {items.length > 0 && (
          <Link href="/dashboard/priorities" className="btn-ghost btn-sm min-h-[40px]">
            Manage
          </Link>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState
          variant="inline"
          headingLevel="h3"
          icon="flag"
          title="Rank what comes first"
          description="Religion, health, family — whatever actually comes first — so the rest of the day has a compass."
          actionLabel="Add priorities"
          actionHref="/dashboard/priorities"
        />
      ) : (
        <ol className="space-y-2">
          {items.map((item, index) => (
            <li key={item.id} className="flex items-start gap-3">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold tabular-nums text-brand-700 dark:bg-brand-950 dark:text-brand-300"
                aria-hidden="true"
              >
                {index + 1}
              </span>
              <div className="min-w-0 pt-0.5">
                <p className="font-medium text-slate-800 dark:text-slate-100">{item.title}</p>
                {item.note && <p className="text-sm text-muted">{item.note}</p>}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
