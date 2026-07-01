import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { formatDate, formatDaysAgo, addDays } from "@/lib/date";
import {
  RELATIONSHIPS,
  RELATIONSHIP_LABELS,
  relationshipLabel,
  isPersonalRelationship,
} from "@/lib/contacts";
import PageHeader from "@/components/PageHeader";
import SubmitButton from "@/components/SubmitButton";
import SubmitIconButton from "@/components/SubmitIconButton";
import { createContact, toggleFollowUp } from "./actions";

export default async function NetworkingPage({
  searchParams,
}: {
  searchParams: { tag?: string; relationship?: string };
}) {
  const user = await requireUser();
  const userId = user.id;
  const tagFilter = searchParams.tag?.trim();
  const relationshipFilter = searchParams.relationship?.trim();

  const [contacts, pendingFollowUps] = await Promise.all([
    prisma.contact.findMany({
      where: { userId, deletedAt: null },
      orderBy: { name: "asc" },
      include: {
        interactions: { orderBy: { date: "desc" }, take: 10 },
      },
    }),
    prisma.followUp.findMany({
      where: { userId, done: false },
      orderBy: { dueDate: "asc" },
      include: { contact: true },
    }),
  ]);

  const allTags = [
    ...new Set(
      contacts.flatMap((c) => (c.tags ? c.tags.split(",").map((t) => t.trim()) : [])).filter(Boolean)
    ),
  ].sort();

  const usedRelationships = [
    ...new Set(contacts.map((c) => c.relationship).filter(Boolean) as string[]),
  ].sort();

  const filtered = contacts.filter((c) => {
    const tagMatch =
      !tagFilter ||
      c.tags
        ?.split(",")
        .map((t) => t.trim().toLowerCase())
        .includes(tagFilter.toLowerCase());
    const relMatch =
      !relationshipFilter ||
      (c.relationship ?? "other").toLowerCase() === relationshipFilter.toLowerCase();
    return tagMatch && relMatch;
  });

  function filterHref(overrides: { tag?: string | null; relationship?: string | null }) {
    const params = new URLSearchParams();
    const tag = overrides.tag !== undefined ? overrides.tag : tagFilter;
    const rel = overrides.relationship !== undefined ? overrides.relationship : relationshipFilter;
    if (tag) params.set("tag", tag);
    if (rel) params.set("relationship", rel);
    const qs = params.toString();
    return qs ? `/dashboard/networking?${qs}` : "/dashboard/networking";
  }

  return (
    <div>
      <PageHeader
        title="Networking"
        description="Track everyone you stay in touch with — family, friends, and professional contacts."
      />

      {pendingFollowUps.length > 0 && (
        <div className="card mb-6">
          <h2 className="section-title mb-3">Pending follow-ups</h2>
          <div className="space-y-1">
            {pendingFollowUps.map((f) => (
              <form key={f.id} action={toggleFollowUp} className="flex items-center gap-3">
                <input type="hidden" name="id" value={f.id} />
                <input type="hidden" name="contactId" value={f.contactId} />
                <SubmitIconButton
                  className="h-4 w-4 rounded border border-slate-300 hover:border-brand-500"
                  title="Mark done"
                  icon={null}
                />
                <span className="flex-1 text-sm text-slate-700">
                  {f.note}{" "}
                  <Link href={`/dashboard/networking/${f.contactId}`} className="text-brand-600 hover:underline">
                    {f.contact.name}
                  </Link>
                </span>
                {f.dueDate && <span className="text-xs text-slate-400">{formatDate(f.dueDate)}</span>}
              </form>
            ))}
          </div>
        </div>
      )}

      {(usedRelationships.length > 0 || allTags.length > 0) && (
        <div className="mb-4 space-y-2">
          {usedRelationships.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <Link
                href={filterHref({ relationship: null })}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  !relationshipFilter
                    ? "bg-brand-600 text-white"
                    : "bg-white text-slate-600 ring-1 ring-slate-200"
                }`}
              >
                All people
              </Link>
              {usedRelationships.map((rel) => (
                <Link
                  key={rel}
                  href={filterHref({ relationship: rel })}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    relationshipFilter?.toLowerCase() === rel.toLowerCase()
                      ? "bg-brand-600 text-white"
                      : "bg-white text-slate-600 ring-1 ring-slate-200"
                  }`}
                >
                  {RELATIONSHIP_LABELS[rel] ?? rel}
                </Link>
              ))}
            </div>
          )}
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <Link
                href={filterHref({ tag: null })}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  !tagFilter ? "bg-slate-200 text-slate-700" : "bg-white text-slate-600 ring-1 ring-slate-200"
                }`}
              >
                All tags
              </Link>
              {allTags.map((tag) => (
                <Link
                  key={tag}
                  href={filterHref({ tag })}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    tagFilter?.toLowerCase() === tag.toLowerCase()
                      ? "bg-slate-200 text-slate-700"
                      : "bg-white text-slate-600 ring-1 ring-slate-200"
                  }`}
                >
                  {tag}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      <details className="card mb-6">
        <summary className="cursor-pointer font-medium text-brand-700">+ Add contact</summary>
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
          <div>
            <label className="label">Organization (optional)</label>
            <input name="org" className="input" placeholder="For work contacts" />
          </div>
          <div>
            <label className="label">Role (optional)</label>
            <input name="role" className="input" />
          </div>
          <div>
            <label className="label">Tags</label>
            <input name="tags" className="input" placeholder="comma,separated" />
          </div>
          <div>
            <label className="label">Email</label>
            <input name="email" type="email" className="input" />
          </div>
          <div>
            <label className="label">Phone</label>
            <input name="phone" className="input" />
          </div>
          <div>
            <label className="label">Touch every (days)</label>
            <input name="touchCadenceDays" type="number" className="input" placeholder="e.g. 14" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Notes</label>
            <textarea name="notes" className="input" rows={2} />
          </div>
          <div className="sm:col-span-2">
            <SubmitButton className="btn-primary">Add contact</SubmitButton>
          </div>
        </form>
      </details>

      <h2 className="section-title mb-3">
        Contacts ({filtered.length}
        {relationshipFilter ? ` · ${RELATIONSHIP_LABELS[relationshipFilter] ?? relationshipFilter}` : ""}
        {tagFilter ? ` · ${tagFilter}` : ""})
      </h2>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {filtered.length === 0 && <p className="text-sm text-slate-400">No contacts yet.</p>}
        {filtered.map((c) => {
          const last = c.interactions[0];
          const lastCall = c.interactions.find((i) => i.type === "call");
          const cadenceDays = c.touchCadenceDays ?? 30;
          const cadenceThreshold = addDays(new Date(), -cadenceDays);
          const dormant = !last || last.date < cadenceThreshold;
          const relLabel = relationshipLabel(c.relationship);
          const showWork = !isPersonalRelationship(c.relationship) && (c.role || c.org);

          return (
            <div key={c.id} className="card transition hover:shadow-md">
              <Link href={`/dashboard/networking/${c.id}`} className="block">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-slate-800">{c.name}</p>
                    {showWork ? (
                      <p className="text-xs text-slate-400">
                        {c.role}
                        {c.role && c.org && " · "}
                        {c.org}
                      </p>
                    ) : relLabel ? (
                      <p className="text-xs text-slate-400">{relLabel}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {relLabel && showWork && (
                      <span className="badge bg-brand-50 text-brand-700">{relLabel}</span>
                    )}
                    {dormant && (
                      <span className="badge bg-amber-100 text-amber-700">
                        {last ? `${cadenceDays}d+ silent` : "no contact"}
                      </span>
                    )}
                  </div>
                </div>
                {c.tags && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {c.tags.split(",").map((t) => (
                      <span key={t} className="badge bg-slate-100 text-slate-500">
                        {t.trim()}
                      </span>
                    ))}
                  </div>
                )}
                <p className="mt-2 text-xs font-medium text-slate-600">
                  Last call:{" "}
                  <span className="font-normal text-slate-500">
                    {lastCall ? formatDaysAgo(lastCall.date) : "Never"}
                  </span>
                </p>
                {last && last.type !== "call" && (
                  <p className="text-xs text-slate-400">
                    Last contact: {formatDaysAgo(last.date)} ({last.type})
                  </p>
                )}
              </Link>
              <div className="mt-3 border-t border-slate-100 pt-2">
                <Link
                  href={`/dashboard/networking/${c.id}?log=call`}
                  className="text-xs font-medium text-brand-600 hover:underline"
                >
                  Log call →
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
