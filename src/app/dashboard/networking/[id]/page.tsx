import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { toDateInputValue, formatDate, formatDaysAgo, addDays } from "@/lib/date";
import {
  RELATIONSHIPS,
  RELATIONSHIP_LABELS,
  relationshipLabel,
  isPersonalRelationship,
} from "@/lib/contacts";
import PageHeader from "@/components/PageHeader";
import Icon from "@/components/Icon";
import SubmitButton from "@/components/SubmitButton";
import SubmitIconButton from "@/components/SubmitIconButton";
import {
  logInteraction,
  logCallToday,
  addFollowUp,
  toggleFollowUp,
  deleteContact,
  updateContact,
  deleteInteraction,
} from "../actions";

const TYPES = ["call", "meeting", "message", "event"];

export default async function ContactDetail({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { log?: string };
}) {
  const user = await requireUser();
  const now = new Date();
  const followUpDefault = toDateInputValue(addDays(now, 14));
  const defaultInteractionType = searchParams.log === "call" ? "call" : "message";

  const contact = await prisma.contact.findFirst({
    where: { id: params.id, userId: user.id, deletedAt: null },
    include: {
      interactions: { orderBy: { date: "desc" } },
      followUps: { orderBy: [{ done: "asc" }, { dueDate: "asc" }] },
    },
  });

  if (!contact) notFound();

  const lastCall = contact.interactions.find((i) => i.type === "call");
  const relLabel = relationshipLabel(contact.relationship);
  const descriptionParts = isPersonalRelationship(contact.relationship)
    ? [relLabel].filter(Boolean)
    : [contact.role, contact.org, relLabel].filter(Boolean);

  return (
    <div>
      <PageHeader
        title={contact.name}
        description={descriptionParts.join(" · ") || undefined}
        action={
          <Link href="/dashboard/networking" className="btn-ghost">
            ← All contacts
          </Link>
        }
      />

      <div className="card mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">Last called</p>
          <p className="text-lg font-semibold text-slate-800">
            {lastCall ? formatDaysAgo(lastCall.date) : "Never"}
          </p>
          {lastCall && <p className="text-xs text-slate-400">{formatDate(lastCall.date)}</p>}
        </div>
        <form action={logCallToday} className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="contactId" value={contact.id} />
          <div>
            <label className="label">Quick log call</label>
            <input name="summary" className="input" placeholder="optional note" />
          </div>
          <SubmitButton className="btn-primary">Log call today</SubmitButton>
        </form>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card lg:col-span-1">
          <h2 className="section-title mb-2">Details</h2>
          <form action={updateContact} className="space-y-2">
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
              <Icon name="trash" className="h-4 w-4" /> Delete contact
            </SubmitButton>
          </form>
        </div>

        <div className="card lg:col-span-2">
          <h2 className="section-title mb-3">Follow-ups</h2>
          <form action={addFollowUp} className="mb-3 flex flex-wrap items-end gap-2">
            <input type="hidden" name="contactId" value={contact.id} />
            <div className="flex-1">
              <label className="label">Note</label>
              <input name="note" className="input" placeholder="e.g. Call again next week" required />
            </div>
            <div>
              <label className="label">Due</label>
              <input name="dueDate" type="date" className="input" />
            </div>
            <SubmitButton className="btn-ghost">Add</SubmitButton>
          </form>
          <div className="space-y-1">
            {contact.followUps.length === 0 && <p className="text-sm text-slate-400">No follow-ups.</p>}
            {contact.followUps.map((f) => (
              <form key={f.id} action={toggleFollowUp} className="flex items-center gap-3">
                <input type="hidden" name="id" value={f.id} />
                <input type="hidden" name="contactId" value={contact.id} />
                <SubmitIconButton
                  className={`flex h-4 w-4 items-center justify-center rounded border ${
                    f.done ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300"
                  }`}
                  icon={f.done ? <Icon name="check" className="h-3 w-3" /> : null}
                />
                <span className={`flex-1 text-sm ${f.done ? "text-slate-400 line-through" : "text-slate-700"}`}>
                  {f.note}
                </span>
                {f.dueDate && <span className="text-xs text-slate-400">{formatDate(f.dueDate)}</span>}
              </form>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="section-title mb-3">Interactions</h2>
        <form action={logInteraction} className="mb-4 space-y-3">
          <input type="hidden" name="contactId" value={contact.id} />
          <div className="flex flex-wrap items-end gap-2">
            <div>
              <label className="label">Type</label>
              <select name="type" className="input" defaultValue={defaultInteractionType}>
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Date</label>
              <input name="date" type="date" className="input" defaultValue={toDateInputValue(now)} />
            </div>
            <div className="flex-1">
              <label className="label">Summary</label>
              <input
                name="summary"
                className="input"
                placeholder={defaultInteractionType === "call" ? "What did you talk about?" : "What happened?"}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input name="scheduleFollowUp" type="checkbox" defaultChecked={defaultInteractionType !== "call"} />
            Schedule follow-up in 2 weeks
          </label>
          <div className="flex flex-wrap gap-2 pl-6">
            <input name="followUpNote" className="input flex-1" placeholder="Follow-up note" />
            <input name="followUpDueDate" type="date" className="input" defaultValue={followUpDefault} />
          </div>
          <SubmitButton className="btn-primary">Log interaction</SubmitButton>
        </form>
        <div className="space-y-2">
          {contact.interactions.length === 0 && (
            <p className="text-sm text-slate-400">No interactions logged yet.</p>
          )}
          {contact.interactions.map((it) => (
            <div key={it.id} className="flex items-start gap-3 border-t border-slate-100 pt-2 text-sm">
              <span
                className={`badge capitalize ${
                  it.type === "call" ? "bg-brand-50 text-brand-700" : "bg-slate-100 text-slate-500"
                }`}
              >
                {it.type}
              </span>
              <div className="flex-1">
                {it.summary && <p className="text-slate-700">{it.summary}</p>}
                <p className="text-xs text-slate-400">
                  {formatDate(it.date)} · {formatDaysAgo(it.date)}
                </p>
              </div>
              <form action={deleteInteraction}>
                <input type="hidden" name="id" value={it.id} />
                <input type="hidden" name="contactId" value={contact.id} />
                <SubmitIconButton
                  className="text-slate-300 hover:text-red-500"
                  icon={<Icon name="trash" className="h-3 w-3" />}
                />
              </form>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
