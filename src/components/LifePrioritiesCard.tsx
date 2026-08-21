import Link from "next/link";
import Icon from "@/components/Icon";
import type { LifePriorityItem } from "@/lib/queries/priorities";

type Props = {
  items: LifePriorityItem[];
};

export default function LifePrioritiesCard({ items }: Props) {
  return (
    <section className="card mb-6 border-l-4 border-l-brand-500">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="section-title">Life priorities</h2>
          <p className="mt-1 text-sm text-slate-500">What you serve first.</p>
        </div>
        <Link href="/dashboard/priorities" className="btn-ghost text-sm">
          {items.length === 0 ? "Add" : "Manage"}
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="flex items-start gap-3">
          <Icon name="flag" className="mt-0.5 h-5 w-5 shrink-0 text-brand-500" />
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Rank religion, health, family — whatever actually comes first — so the rest of the day has a compass.
            </p>
            <Link href="/dashboard/priorities" className="btn-primary mt-3 inline-flex text-sm">
              Add priorities
            </Link>
          </div>
        </div>
      ) : (
        <ol className="space-y-2">
          {items.map((item, index) => (
            <li key={item.id} className="flex items-start gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold tabular-nums text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                {index + 1}
              </span>
              <div className="min-w-0 pt-0.5">
                <p className="font-medium text-slate-800 dark:text-slate-100">{item.title}</p>
                {item.note && (
                  <p className="text-sm text-slate-500 dark:text-slate-400">{item.note}</p>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
