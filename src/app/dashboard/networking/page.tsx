import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { formatDate, addDays } from "@/lib/date";
import PageHeader from "@/components/PageHeader";
import SubmitButton from "@/components/SubmitButton";
import SubmitIconButton from "@/components/SubmitIconButton";
import { createContact, toggleFollowUp } from "./actions";

export default async function NetworkingPage({
  searchParams,
}: {
  searchParams: { tag?: string };
}) {
  const user = await requireUser();
  const userId = user.id;
  const tagFilter = searchParams.tag?.trim();

  const [contacts, pendingFollowUps] = await Promise.all([
    prisma.contact.findMany({
      where: { userId, deletedAt: null },
      orderBy: { name: "asc" },
      include: {
        interactions: { orderBy: { date: "desc" }, take: 1 },
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

  const filtered = tagFilter
    ? contacts.filter((c) =>
        c.tags
          ?.split(",")
          .map((t) => t.trim().toLowerCase())
          .includes(tagFilter.toLowerCase())
      )
    : contacts;

  const dormantThreshold = addDays(new Date(), -30);

  return (
    <div>
      <PageHeader title="Networking" description="Keep track of contacts, interactions, and follow-ups." />

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

      {allTags.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          <Link
            href="/dashboard/networking"
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              !tagFilter ? "bg-brand-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"
            }`}
          >
            All
          </Link>
          {allTags.map((tag) => (
            <Link
              key={tag}
              href={`/dashboard/networking?tag=${encodeURIComponent(tag)}`}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                tagFilter?.toLowerCase() === tag.toLowerCase()
                  ? "bg-brand-600 text-white"
                  : "bg-white text-slate-600 ring-1 ring-slate-200"
              }`}
            >
              {tag}
            </Link>
          ))}
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
            <label className="label">Organization</label>
            <input name="org" className="input" />
          </div>
          <div>
            <label className="label">Role</label>
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
        {tagFilter ? ` · ${tagFilter}` : ""})
      </h2>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {filtered.length === 0 && <p className="text-sm text-slate-400">No contacts yet.</p>}
        {filtered.map((c) => {
          const last = c.interactions[0];
          const cadenceDays = c.touchCadenceDays ?? 30;
          const cadenceThreshold = addDays(new Date(), -cadenceDays);
          const dormant = !last || last.date < cadenceThreshold;
          return (
            <Link key={c.id} href={`/dashboard/networking/${c.id}`} className="card transition hover:shadow-md">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-slate-800">{c.name}</p>
                  {(c.role || c.org) && (
                    <p className="text-xs text-slate-400">
                      {c.role}
                      {c.role && c.org && " · "}
                      {c.org}
                    </p>
                  )}
                </div>
                {dormant && (
                  <span className="badge bg-amber-100 text-amber-700">
                    {last ? `${cadenceDays}d+ silent` : "no contact"}
                  </span>
                )}
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
              <p className="mt-2 text-xs text-slate-400">
                {last ? `Last: ${formatDate(last.date)}` : "No interactions yet"}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
