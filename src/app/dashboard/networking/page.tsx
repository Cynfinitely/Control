import { requireModule } from "@/lib/session";
import { formatRange } from "@/lib/date";
import { RELATIONSHIP_LABELS } from "@/lib/contacts";
import { buildNetworkingInsights, rangeForNetworkingPeriod, type NetworkingPeriod } from "@/lib/networking";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import TabNav from "@/components/TabNav";
import SegmentedControl from "@/components/SegmentedControl";
import CollapsibleSection from "@/components/CollapsibleSection";
import FocusTarget from "@/components/FocusTarget";
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
import AddPersonForm from "./AddPersonForm";
import { logTouchForm } from "./actions";

export const metadata = { title: "Networking" };

function parsePeriod(value: string | undefined): NetworkingPeriod {
  if (value === "weekly" || value === "90d") return value;
  return "monthly";
}

export default async function NetworkingPage({
  searchParams,
}: {
  searchParams: { tab?: string; relationship?: string; period?: string; person?: string };
}) {
  const user = await requireModule("networking");
  const tab = parseNetworkingTab(searchParams.tab);
  const relationshipFilter = searchParams.relationship?.trim();
  const period = parsePeriod(searchParams.period);

  return (
    <div>
      <PageHeader
        title="Networking"
        description="Log a call in a few taps. Add topics when you want the detail."
      >
        <NetworkingTabs active={tab} />
      </PageHeader>
      {tab === "people" ? (
        <PeopleTab userId={user.id} relationshipFilter={relationshipFilter} />
      ) : tab === "insights" ? (
        <InsightsTab userId={user.id} period={period} />
      ) : (
        <LogTab userId={user.id} personId={searchParams.person} />
      )}
    </div>
  );
}

async function LogTab({ userId, personId }: { userId: string; personId?: string }) {
  const [contacts, suggestedTopics, activity] = await Promise.all([
    getComposerContacts(userId),
    getSuggestedTopics(userId),
    getRecentActivity(userId),
  ]);

  return (
    <>
      <FocusTarget value="log">
        <LogComposer
          contacts={contacts}
          suggestedTopics={suggestedTopics}
          action={logTouchForm}
          initialContactId={personId}
        />
      </FocusTarget>
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
      <FocusTarget value="add">
        <CollapsibleSection title="Add person" variant="card" className="mb-4">
          <AddPersonForm />
        </CollapsibleSection>
      </FocusTarget>

      {usedRelationships.length > 0 && (
        <TabNav
          aria-label="Filter people by relationship"
          variant="pills"
          className="mb-4"
          active={relationshipFilter ? relationshipFilter.toLowerCase() : "__all"}
          items={[
            { id: "__all", href: href(null), label: "All people" },
            ...usedRelationships.map((rel) => ({
              id: rel.toLowerCase(),
              href: href(rel),
              label: RELATIONSHIP_LABELS[rel] ?? rel,
            })),
          ]}
        />
      )}

      {people.length === 0 ? (
        <EmptyState
          icon="users"
          title="No people yet"
          description="Add someone here, or type a new name when you log a call."
          actionLabel="Add a person"
          actionHref="/dashboard/networking?tab=people&focus=add"
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
        <p className="text-sm text-muted">{formatRange(range.from, range.to)}</p>
        <SegmentedControl
          aria-label="Insights period"
          value={period}
          options={periods.map((p) => ({
            value: p.id,
            label: p.label,
            href: `/dashboard/networking?tab=insights&period=${p.id}`,
          }))}
        />
      </div>
      <InsightsPanel insights={insights} activity={activity} />
    </>
  );
}
