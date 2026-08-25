import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { formatDate, formatDaysAgo } from "@/lib/date";
import {
  RELATIONSHIPS,
  RELATIONSHIP_LABELS,
  relationshipLabel,
  isPersonalRelationship,
} from "@/lib/contacts";
import { DEFAULT_CADENCE_DAYS, isOverdue } from "@/lib/networking";
import PageHeader from "@/components/PageHeader";
import Breadcrumb from "@/components/Breadcrumb";
import Icon from "@/components/Icon";
import SubmitButton from "@/components/SubmitButton";
import LogComposer from "../LogComposer";
import ActivityFeed from "../ActivityFeed";
import { logTouchForm, updateContact, deleteContact } from "../actions";
import { getComposerContacts, getSuggestedTopics } from "@/lib/queries/networking";

export default async function ContactDetail({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const [contact, contacts, suggestedTopics] = await Promise.all([
    prisma.contact.findFirst({
      where: { id: params.id, userId: user.id, deletedAt: null },
      include: {
        interactions: { orderBy: { date: "desc" } },
      },
    }),
    getComposerContacts(user.id),
    getSuggestedTopics(user.id),
  ]);

  if (!contact) notFound();

  const last = contact.interactions[0];
  const lastCall = contact.interactions.find((i) => i.type === "call");
  const overdue = isOverdue(last?.date ?? null, contact.touchCadenceDays, new Date());
  const cadenceDays = contact.touchCadenceDays ?? DEFAULT_CADENCE_DAYS;
  const relLabel = relationshipLabel(contact.relationship);
  const descriptionParts = isPersonalRelationship(contact.relationship)
    ? [relLabel].filter(Boolean)
    : [contact.role, contact.org, relLabel].filter(Boolean);

  const activity = contact.interactions.map((it) => ({
    id: it.id,
    type: it.type,
    topics: it.topics,
    summary: it.summary,
    date: it.date,
    contactId: contact.id,
    contactName: contact.name,
  }));

  const lockedContact = {
    id: contact.id,
    name: contact.name,
    relationship: contact.relationship,
  };

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Networking", href: "/dashboard/networking" },
          { label: "People", href: "/dashboard/networking?tab=people" },
          { label: contact.name },
        ]}
      />
      <PageHeader
        title={contact.name}
        description={descriptionParts.join(" · ") || undefined}
      />

      <div className="card mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">Last contact</p>
          <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            {last ? formatDaysAgo(last.date) : "Never"}
          </p>
          {last && (
            <p className="text-xs text-slate-400">
              {formatDate(last.date)}
              {lastCall && last.type !== "call" ? ` · last call ${formatDaysAgo(lastCall.date)}` : ""}
            </p>
          )}
        </div>
        {overdue && (
          <span className="badge bg-amber-100 text-amber-700">
            {last ? `${cadenceDays}d+ silent` : "no contact"}
          </span>
        )}
      </div>

      <LogComposer
        contacts={contacts}
        suggestedTopics={suggestedTopics}
        action={logTouchForm}
        lockedContact={lockedContact}
      />

      <div className="card mb-6">
        <h2 className="section-title mb-3">Timeline</h2>
        <ActivityFeed items={activity} showPerson={false} empty="No logs with this person yet." />
      </div>

      <details className="card">
        <summary className="cursor-pointer font-medium text-slate-700 dark:text-slate-200">Edit person</summary>
        <form action={updateContact} className="mt-4 space-y-2">
          <input type="hidden" name="id" value={contact.id} />
          <div>
            <label className="label">Name</label>
            <input name="name" className="input" defaultValue={contact.name} required />
          </div>
          <div>
            <label className="label">Relationship</label>
            <select name="relationship" className="input" defaultValue={contact.relationship ?? "other"}>
              {RELATIONSHIPS.map((r) => (
                <option key={r} value={r}>
                  {RELATIONSHIP_LABELS[r]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Organization (optional)</label>
            <input name="org" className="input" defaultValue={contact.org ?? ""} placeholder="For work contacts" />
          </div>
          <div>
            <label className="label">Role (optional)</label>
            <input name="role" className="input" defaultValue={contact.role ?? ""} />
          </div>
          <div>
            <label className="label">Email</label>
            <input name="email" type="email" className="input" defaultValue={contact.email ?? ""} />
          </div>
          <div>
            <label className="label">Phone</label>
            <input name="phone" className="input" defaultValue={contact.phone ?? ""} />
            {contact.phone && (
              <a href={`tel:${contact.phone}`} className="mt-1 inline-block text-xs text-brand-600 hover:underline">
                Call {contact.phone}
              </a>
            )}
          </div>
          <div>
            <label className="label">Tags</label>
            <input name="tags" className="input" defaultValue={contact.tags ?? ""} />
          </div>
          <div>
            <label className="label">Touch every (days)</label>
            <input
              name="touchCadenceDays"
              type="number"
              className="input"
              defaultValue={contact.touchCadenceDays ?? ""}
              placeholder={`${DEFAULT_CADENCE_DAYS}`}
            />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea name="notes" className="input" rows={2} defaultValue={contact.notes ?? ""} />
          </div>
          <SubmitButton className="btn-primary w-full text-sm">Save changes</SubmitButton>
        </form>
        <form action={deleteContact} className="mt-4">
          <input type="hidden" name="id" value={contact.id} />
          <SubmitButton className="btn-danger w-full">
            <Icon name="trash" className="h-4 w-4" /> Delete person
          </SubmitButton>
        </form>
      </details>
    </div>
  );
}
