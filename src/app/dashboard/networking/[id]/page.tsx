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
import ActionForm from "@/components/ActionForm";
import FormField from "@/components/FormField";
import CollapsibleSection from "@/components/CollapsibleSection";
import LogComposer from "../LogComposer";
import ActivityFeed from "../ActivityFeed";
import { logTouchForm, updateContact, deleteContact } from "../actions";
import { getComposerContacts, getSuggestedTopics } from "@/lib/queries/networking";

export const metadata = { title: "Person" };

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
        action={
          contact.phone || contact.email ? (
            <>
              {contact.phone && (
                <a href={`tel:${contact.phone}`} className="btn-ghost touch-target" aria-label={`Call ${contact.name} (${contact.phone})`}>
                  <Icon name="phone" className="h-4 w-4" /> Call
                </a>
              )}
              {contact.email && (
                <a href={`mailto:${contact.email}`} className="btn-ghost touch-target" aria-label={`Email ${contact.name} (${contact.email})`}>
                  <Icon name="mail" className="h-4 w-4" /> Email
                </a>
              )}
            </>
          ) : undefined
        }
      />

      <div className="card mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted">Last contact</p>
          <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            {last ? formatDaysAgo(last.date) : "Never"}
          </p>
          {last && (
            <p className="text-xs text-muted">
              {formatDate(last.date)}
              {lastCall && last.type !== "call" ? ` · last call ${formatDaysAgo(lastCall.date)}` : ""}
            </p>
          )}
        </div>
        {overdue && (
          <span className="badge-warning">
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

      <CollapsibleSection title="Edit person" variant="card" icon="pencil">
        <ActionForm action={updateContact} successMessage="Saved" className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <input type="hidden" name="id" value={contact.id} />
          <FormField label="Name" required>
            {(_id, aria) => <input {...aria} name="name" className="input" defaultValue={contact.name} required />}
          </FormField>
          <FormField label="Relationship">
            {(_id, aria) => (
              <select {...aria} name="relationship" className="input" defaultValue={contact.relationship ?? "other"}>
                {RELATIONSHIPS.map((r) => (
                  <option key={r} value={r}>
                    {RELATIONSHIP_LABELS[r]}
                  </option>
                ))}
              </select>
            )}
          </FormField>
          <FormField label="Organization" hint="Optional, for work contacts">
            {(_id, aria) => <input {...aria} name="org" className="input" defaultValue={contact.org ?? ""} />}
          </FormField>
          <FormField label="Role" hint="Optional">
            {(_id, aria) => <input {...aria} name="role" className="input" defaultValue={contact.role ?? ""} />}
          </FormField>
          <FormField label="Email">
            {(_id, aria) => (
              <input {...aria} name="email" type="email" autoComplete="off" className="input" defaultValue={contact.email ?? ""} />
            )}
          </FormField>
          <FormField label="Phone">
            {(_id, aria) => (
              <input {...aria} name="phone" type="tel" autoComplete="off" className="input" defaultValue={contact.phone ?? ""} />
            )}
          </FormField>
          <FormField label="Tags">
            {(_id, aria) => <input {...aria} name="tags" className="input" defaultValue={contact.tags ?? ""} />}
          </FormField>
          <FormField label="Touch every (days)" hint={`Defaults to ${DEFAULT_CADENCE_DAYS} days`}>
            {(_id, aria) => (
              <input
                {...aria}
                name="touchCadenceDays"
                type="number"
                min={1}
                className="input"
                defaultValue={contact.touchCadenceDays ?? ""}
                placeholder={`${DEFAULT_CADENCE_DAYS}`}
              />
            )}
          </FormField>
          <FormField label="Notes" className="sm:col-span-2">
            {(_id, aria) => <textarea {...aria} name="notes" className="input" rows={2} defaultValue={contact.notes ?? ""} />}
          </FormField>
          <div className="sm:col-span-2">
            <SubmitButton className="btn-primary">Save changes</SubmitButton>
          </div>
        </ActionForm>
        <div className="mt-6 border-t border-slate-100 pt-4 dark:border-slate-700">
          <ActionForm
            action={deleteContact}
            confirm={{
              title: `Delete “${contact.name}”?`,
              message: "Their logs will no longer appear in your timeline or insights.",
              confirmLabel: "Delete person",
            }}
            successMessage={false}
          >
            <input type="hidden" name="id" value={contact.id} />
            <SubmitButton className="btn-danger">
              <Icon name="trash" className="h-4 w-4" /> Delete person
            </SubmitButton>
          </ActionForm>
        </div>
      </CollapsibleSection>
    </div>
  );
}
