import Link from "next/link";
import { requireUser } from "@/lib/session";
import { formatDate } from "@/lib/date";
import { RELATIONSHIPS, RELATIONSHIP_LABELS } from "@/lib/contacts";
import { buildNetworkingInsights, rangeForNetworkingPeriod, type NetworkingPeriod } from "@/lib/networking";
import PageHeader from "@/components/PageHeader";
import SubmitButton from "@/components/SubmitButton";
import EmptyState from "@/components/EmptyState";
import {
  getComposerContacts,
  getSuggestedTopics,
  getRecentActivity,
  getPeopleRows,
  getInsightsSource,
} from "@/lib/queries/networking";
import NetworkingTabs, { parseNetworkingTab } from "./NetworkingTabs";
import LogComposer from "./LogComposer";
import ActivityFeed from "./ActivityFeed";
import PeopleList from "./PeopleList";
import InsightsPanel from "./InsightsPanel";
import { createContact, logTouchForm } from "./actions";

function parsePeriod(value: string | undefined): NetworkingPeriod {
  if (value === "weekly" || value === "90d") return value;
  return "monthly";
}

export default async function NetworkingPage({
  searchParams,
}: {
  searchParams: { tab?: string; relationship?: string; period?: string };
}) {
  const user = await requireUser();
  const tab = parseNetworkingTab(searchParams.tab);
  const relationshipFilter = searchParams.relationship?.trim();
  const period = parsePeriod(searchParams.period);

  return (
    <div>
      <PageHeader
        title="Networking"
        description="Log a call in a few taps. Add topics when you want the detail."
      />
      <NetworkingTabs active={tab} />
      {tab === "people" ? (
        <PeopleTab userId={user.id} relationshipFilter={relationshipFilter} />
      ) : tab === "insights" ? (
        <InsightsTab userId={user.id} period={period} />
      ) : (
        <LogTab userId={user.id} />
      )}
    </div>
  );
}

async function LogTab({ userId }: { userId: string }) {
  const [contacts, suggestedTopics, activity] = await Promise.all([
    getComposerContacts(userId),
    getSuggestedTopics(userId),
    getRecentActivity(userId),
  ]);

  return (
    <>
      <LogComposer contacts={contacts} suggestedTopics={suggestedTopics} action={logTouchForm} />
      {activity.length === 0 ? (
        <EmptyState
          icon="users"
          title="No logs yet"
          description="Pick someone, set the date to yesterday if needed, and tap Log."
        />
      ) : (
        <div className="card">
          <h2 className="section-title mb-3">Recent</h2>
          <ActivityFeed items={activity} />
        </div>
      )}
    </>
  );
}

async function PeopleTab({
  userId,
  relationshipFilter,
}: {
  userId: string;
  relationshipFilter?: string;
}) {
  const people = await getPeopleRows(userId);
  const usedRelationships = [...new Set(people.map((p) => p.relationship).filter(Boolean) as string[])].sort();
  const filtered = relationshipFilter
    ? people.filter((p) => (p.relationship ?? "other").toLowerCase() === relationshipFilter.toLowerCase())
    : people;

  function href(rel: string | null) {
    const params = new URLSearchParams({ tab: "people" });
    if (rel) params.set("relationship", rel);
    return `/dashboard/networking?${params.toString()}`;
  }

  return (
    <>
      <details className="card mb-4">
        <summary className="cursor-pointer font-medium text-brand-700 dark:text-brand-400">+ Add person</summary>
        <form action={createContact} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Name</label>
            <input name="name" className="input" required />
          </div>
          <div>
            <label className="label">Relationship</label>
            <select name="relationship" className="input" defaultValue="other">
              {RELATIONSHIPS.map((r) => (
                <option key={r} value={r}>
                  {RELATIONSHIP_LABELS[r]}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <SubmitButton className="btn-primary">Add person</SubmitButton>
          </div>
        </form>
      </details>

      {usedRelationships.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          <Link
            href={href(null)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              !relationshipFilter
                ? "bg-brand-600 text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700"
            }`}
          >
            All people
          </Link>
          {usedRelationships.map((rel) => (
            <Link
              key={rel}
              href={href(rel)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                relationshipFilter?.toLowerCase() === rel.toLowerCase()
                  ? "bg-brand-600 text-white"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700"
              }`}
            >
              {RELATIONSHIP_LABELS[rel] ?? rel}
            </Link>
          ))}
        </div>
      )}

      {people.length === 0 ? (
        <EmptyState
          icon="users"
          title="No people yet"
          description="Add someone here, or type a new name when you log a call."
        />
      ) : (
        <PeopleList people={filtered} />
      )}
    </>
  );
}

async function InsightsTab({ userId, period }: { userId: string; period: NetworkingPeriod }) {
  const now = new Date();
  const range = rangeForNetworkingPeriod(period, now);
  const { contacts, interactions } = await getInsightsSource(userId, range);
  const insights = buildNetworkingInsights(contacts, interactions, range, now);
  const contactName = new Map(contacts.map((c) => [c.id, c.name]));
  const activity = interactions
    .slice()
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .map((it) => ({
      id: it.id,
      type: it.type,
      topics: it.topics,
      summary: it.summary,
      date: it.date,
      contactId: it.contactId,
      contactName: contactName.get(it.contactId) ?? "Unknown",
    }));

  const periods: { id: NetworkingPeriod; label: string }[] = [
    { id: "weekly", label: "This week" },
    { id: "monthly", label: "This month" },
    { id: "90d", label: "90 days" },
  ];

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {formatDate(range.from)} – {formatDate(range.to)}
        </p>
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-800">
          {periods.map((p) => (
            <Link
              key={p.id}
              href={`/dashboard/networking?tab=insights&period=${p.id}`}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                p.id === period
                  ? "bg-brand-600 text-white"
                  : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700"
              }`}
            >
              {p.label}
            </Link>
          ))}
        </div>
      </div>
      <InsightsPanel insights={insights} activity={activity} />
    </>
  );
}
