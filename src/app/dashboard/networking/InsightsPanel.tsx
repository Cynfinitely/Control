import Link from "next/link";
import { formatDate, formatDaysAgo } from "@/lib/date";
import { INTERACTION_TYPE_LABELS } from "@/lib/networking";
import { RELATIONSHIP_LABELS, relationshipLabel } from "@/lib/contacts";
import type { NetworkingInsights } from "@/lib/networking";
import type { ActivityItem } from "@/lib/queries/networking";
import StatCard from "@/components/StatCard";
import EmptyState from "@/components/EmptyState";
import InsightsActivityList from "./InsightsActivityList";

function shortDate(key: string) {
  const d = new Date(key);
  if (isNaN(d.getTime())) return key;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function FrequencyChart({ points }: { points: { weekStart: string; count: number }[] }) {
  const max = Math.max(1, ...points.map((p) => p.count));
  const captionId = "networking-frequency-caption";
  return (
    <figure aria-labelledby={captionId}>
      <figcaption id={captionId} className="sr-only">
        Interactions per week
      </figcaption>
      <div className="flex gap-2" aria-hidden="true">
        <div className="flex h-28 flex-col justify-between text-right text-[11px] tabular-nums text-muted">
          <span>{max}</span>
          <span>0</span>
        </div>
        <div className="flex h-28 flex-1 items-end gap-1 border-b border-l border-slate-200 pl-1 dark:border-slate-700">
          {points.map((p) => (
            <div key={p.weekStart} className="flex h-full flex-1 items-end">
              <div
                className="w-full rounded-t bg-brand-500"
                style={{ height: `${p.count === 0 ? 0 : Math.max(8, Math.round((p.count / max) * 100))}%` }}
                title={`Week of ${formatDate(p.weekStart)}: ${p.count}`}
              />
            </div>
          ))}
        </div>
      </div>
      {points.length > 0 && (
        <div className="mt-1 flex justify-between pl-7 text-[11px] text-muted" aria-hidden="true">
          <span>{shortDate(points[0].weekStart)}</span>
          {points.length > 1 && <span>{shortDate(points[points.length - 1].weekStart)}</span>}
        </div>
      )}
      <p className="mt-1 text-center text-xs text-muted" aria-hidden="true">
        Interactions per week
      </p>
      <table className="sr-only">
        <caption>Interactions per week</caption>
        <thead>
          <tr>
            <th scope="col">Week of</th>
            <th scope="col">Interactions</th>
          </tr>
        </thead>
        <tbody>
          {points.map((p) => (
            <tr key={p.weekStart}>
              <td>{formatDate(p.weekStart)}</td>
              <td>{p.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

function BarList({
  items,
  label,
}: {
  items: { key: string; label: string; count: number }[];
  label: (item: { key: string; label: string; count: number }) => string;
}) {
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.key}>
          <div className="mb-1 flex justify-between gap-2 text-sm">
            <span className="truncate font-medium text-slate-700 dark:text-slate-200">{label(item)}</span>
            <span className="shrink-0 text-slate-600 dark:text-slate-400">{item.count}</span>
          </div>
          <div className="progress-track h-2 w-full overflow-hidden rounded-full" aria-hidden="true">
            <div className="h-full bg-brand-500" style={{ width: `${Math.round((item.count / max) * 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function InsightsPanel({
  insights,
  activity,
}: {
  insights: NetworkingInsights;
  activity: ActivityItem[];
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Touches" value={insights.touches} icon="users" />
        <StatCard label="Calls" value={insights.calls} icon="phone" />
        <StatCard label="People reached" value={insights.uniquePeople} icon="heart" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card">
          <h2 className="section-title mb-3">Frequency</h2>
          {insights.frequency.every((p) => p.count === 0) ? (
            <EmptyState variant="inline" headingLevel="h3" icon="chart" title="No activity in this period" />
          ) : (
            <FrequencyChart points={insights.frequency} />
          )}
        </div>

        <div className="card">
          <h2 className="section-title mb-3">Type mix</h2>
          <BarList
            items={insights.typeMix.map((t) => ({
              key: t.type,
              label: INTERACTION_TYPE_LABELS[t.type] ?? t.type,
              count: t.count,
            }))}
            label={(i) => i.label}
          />
        </div>

        <div className="card">
          <h2 className="section-title mb-3">By relationship</h2>
          <BarList
            items={insights.relationshipMix.map((r) => ({
              key: r.relationship,
              label: RELATIONSHIP_LABELS[r.relationship] ?? r.relationship,
              count: r.count,
            }))}
            label={(i) => i.label}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card">
          <h2 className="section-title mb-3">Overdue</h2>
          {insights.overdue.length === 0 ? (
            <EmptyState variant="inline" headingLevel="h3" icon="check" title="Everyone is within cadence" />
          ) : (
            <ul className="space-y-2">
              {insights.overdue.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 text-sm">
                  <div>
                    <Link href={`/dashboard/networking/${c.id}`} className="font-medium text-brand-700 hover:underline dark:text-brand-400">
                      {c.name}
                    </Link>
                    {relationshipLabel(c.relationship) && (
                      <span className="text-muted"> · {relationshipLabel(c.relationship)}</span>
                    )}
                  </div>
                  <span className="badge-warning">
                    {c.lastTouch ? formatDaysAgo(c.lastTouch) : "no contact"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <h2 className="section-title mb-3">Topics</h2>
          {insights.topics.length === 0 ? (
            <EmptyState
              variant="inline"
              headingLevel="h3"
              icon="sparkles"
              title="No topics yet"
              description="Add topic chips on logs to see trends."
            />
          ) : (
            <div className="space-y-3">
              {insights.topics.slice(0, 12).map((t) => (
                <div key={t.topic}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-medium text-slate-700 dark:text-slate-200">{t.topic}</span>
                    <span className="text-slate-500 dark:text-slate-400">{t.count}</span>
                  </div>
                  <p className="text-xs text-muted">
                    {t.people.map((p) => `${p.name} (${p.count})`).join(" · ")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <InsightsActivityList items={activity} />
    </div>
  );
}
