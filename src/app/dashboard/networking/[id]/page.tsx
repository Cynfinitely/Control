import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { toDateInputValue, formatDate } from "@/lib/date";
import PageHeader from "@/components/PageHeader";
import Icon from "@/components/Icon";
import { logInteraction, addFollowUp, toggleFollowUp, deleteContact } from "../actions";

const TYPES = ["call", "meeting", "message", "event"];

export default async function ContactDetail({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const now = new Date();
  const contact = await prisma.contact.findFirst({
    where: { id: params.id, userId: user.id, deletedAt: null },
    include: {
      interactions: { orderBy: { date: "desc" } },
      followUps: { orderBy: [{ done: "asc" }, { dueDate: "asc" }] },
    },
  });

  if (!contact) notFound();

  return (
    <div>
      <PageHeader
        title={contact.name}
        description={[contact.role, contact.org].filter(Boolean).join(" · ") || undefined}
        action={
          <Link href="/dashboard/networking" className="btn-ghost">
            ← All contacts
          </Link>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card lg:col-span-1">
          <h2 className="section-title mb-2">Details</h2>
          <dl className="space-y-1 text-sm">
            {contact.email && (
              <div className="flex justify-between"><dt className="text-slate-400">Email</dt><dd>{contact.email}</dd></div>
            )}
            {contact.phone && (
              <div className="flex justify-between"><dt className="text-slate-400">Phone</dt><dd>{contact.phone}</dd></div>
            )}
            {contact.tags && (
              <div className="flex justify-between"><dt className="text-slate-400">Tags</dt><dd>{contact.tags}</dd></div>
            )}
          </dl>
          {contact.notes && <p className="mt-3 text-sm text-slate-500">{contact.notes}</p>}
          <form action={deleteContact} className="mt-4">
            <input type="hidden" name="id" value={contact.id} />
            <button className="btn-danger w-full">
              <Icon name="trash" className="h-4 w-4" /> Delete contact
            </button>
          </form>
        </div>

        <div className="card lg:col-span-2">
          <h2 className="section-title mb-3">Follow-ups</h2>
          <form action={addFollowUp} className="mb-3 flex flex-wrap items-end gap-2">
            <input type="hidden" name="contactId" value={contact.id} />
            <div className="flex-1">
              <label className="label">Note</label>
              <input name="note" className="input" placeholder="e.g. Send proposal" required />
            </div>
            <div>
              <label className="label">Due</label>
              <input name="dueDate" type="date" className="input" />
            </div>
            <button className="btn-ghost">Add</button>
          </form>
          <div className="space-y-1">
            {contact.followUps.length === 0 && <p className="text-sm text-slate-400">No follow-ups.</p>}
            {contact.followUps.map((f) => (
              <form key={f.id} action={toggleFollowUp} className="flex items-center gap-3">
                <input type="hidden" name="id" value={f.id} />
                <button
                  className={`flex h-4 w-4 items-center justify-center rounded border ${
                    f.done ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300"
                  }`}
                >
                  {f.done && <Icon name="check" className="h-3 w-3" />}
                </button>
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
        <form action={logInteraction} className="mb-4 flex flex-wrap items-end gap-2">
          <input type="hidden" name="contactId" value={contact.id} />
          <div>
            <label className="label">Type</label>
            <select name="type" className="input" defaultValue="message">
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
            <input name="summary" className="input" placeholder="What was discussed?" />
          </div>
          <button className="btn-primary">Log</button>
        </form>
        <div className="space-y-2">
          {contact.interactions.length === 0 && (
            <p className="text-sm text-slate-400">No interactions logged yet.</p>
          )}
          {contact.interactions.map((it) => (
            <div key={it.id} className="flex items-start gap-3 border-t border-slate-100 pt-2 text-sm">
              <span className="badge bg-slate-100 capitalize text-slate-500">{it.type}</span>
              <div className="flex-1">
                {it.summary && <p className="text-slate-700">{it.summary}</p>}
                <p className="text-xs text-slate-400">{formatDate(it.date)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
