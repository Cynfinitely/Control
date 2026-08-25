import Link from "next/link";
import { formatDate, formatDaysAgo } from "@/lib/date";
import { INTERACTION_TYPE_LABELS } from "@/lib/networking";
import { RELATIONSHIP_LABELS, relationshipLabel } from "@/lib/contacts";
import type { NetworkingInsights } from "@/lib/networking";
import type { ActivityItem } from "@/lib/queries/networking";
import InsightsActivityList from "./InsightsActivityList";

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
            <span className="shrink-0 text-slate-600">{item.count}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
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
  const maxFreq = Math.max(1, ...insights.frequency.map((p) => p.count));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card">
          <p className="text-sm text-slate-500">Touches</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{insights.touches}</p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500">Calls</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{insights.calls}</p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500">People reached</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{insights.uniquePeople}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card">
          <h2 className="section-title mb-3">Frequency</h2>
          {insights.frequency.every((p) => p.count === 0) ? (
            <p className="text-sm text-slate-400">No activity in this period.</p>
          ) : (
            <div className="flex h-28 items-end gap-1">
              {insights.frequency.map((p) => (
                <div key={p.weekStart} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t bg-brand-500"
                    style={{ height: `${Math.max(p.count === 0 ? 0 : 8, Math.round((p.count / maxFreq) * 100))}%` }}
                    title={`${formatDate(p.weekStart)} · ${p.count}`}
                  />
                </div>
              ))}
            </div>
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
            <p className="text-sm text-slate-400">Everyone is within cadence.</p>
          ) : (
            <ul className="space-y-2">
              {insights.overdue.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 text-sm">
                  <div>
                    <Link href={`/dashboard/networking/${c.id}`} className="font-medium text-brand-700 hover:underline">
                      {c.name}
                    </Link>
                    {relationshipLabel(c.relationship) && (
                      <span className="text-slate-400"> · {relationshipLabel(c.relationship)}</span>
                    )}
                  </div>
                  <span className="badge bg-amber-100 text-amber-700">
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
            <p className="text-sm text-slate-400">Add topic chips on logs to see trends.</p>
          ) : (
            <div className="space-y-3">
              {insights.topics.slice(0, 12).map((t) => (
                <div key={t.topic}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-medium text-slate-700 dark:text-slate-200">{t.topic}</span>
                    <span className="text-slate-500">{t.count}</span>
                  </div>
                  <p className="text-xs text-slate-400">
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
