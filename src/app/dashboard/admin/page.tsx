import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { formatDate } from "@/lib/date";
import { inviteStatus, INVITE_DEFAULT_DAYS, INVITE_MAX_DAYS } from "@/lib/invites";
import PageHeader from "@/components/PageHeader";
import Icon from "@/components/Icon";
import ActionForm from "@/components/ActionForm";
import SubmitButton from "@/components/SubmitButton";
import SubmitIconButton from "@/components/SubmitIconButton";
import CollapsibleSection from "@/components/CollapsibleSection";
import EmptyState from "@/components/EmptyState";
import CopyCodeButton from "./CopyCodeButton";
import { createInvite, deleteInvite } from "./actions";

export const metadata = { title: "Admin" };

export default async function AdminPage() {
  await requireAdmin();

  const [invites, users] = await Promise.all([
    prisma.inviteCode.findMany({ orderBy: { createdAt: "desc" }, include: { usedBy: true } }),
    prisma.user.findMany({ orderBy: { createdAt: "desc" } }),
  ]);
  const now = new Date();

  return (
    <div>
      <PageHeader title="Admin" description="Invite people and see who has an account." />

      <CollapsibleSection title="Invite a person" variant="card" className="mb-6" defaultOpen={invites.length === 0}>
        <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
          Create an invite, copy its link and send it to the person yourself. They choose their own password, start
          with an empty account, and can never see your data or anyone else&apos;s.
        </p>
        <ActionForm action={createInvite} resetOnSuccess className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="invite-email" className="label">
              Intended for (email, optional)
            </label>
            <input
              id="invite-email"
              name="email"
              type="email"
              className="input"
              autoComplete="off"
              aria-describedby="invite-email-hint"
            />
            <p id="invite-email-hint" className="hint">
              If set, the account can only be created with this address.
            </p>
          </div>
          <div>
            <label htmlFor="invite-max-uses" className="label">
              Number of people
            </label>
            <input id="invite-max-uses" name="maxUses" type="number" min={1} max={50} className="input" defaultValue={1} />
          </div>
          <div>
            <label htmlFor="invite-expires" className="label">
              Valid for (days)
            </label>
            <input
              id="invite-expires"
              name="expiresInDays"
              type="number"
              min={1}
              max={INVITE_MAX_DAYS}
              className="input"
              defaultValue={INVITE_DEFAULT_DAYS}
            />
          </div>
          <div className="sm:col-span-3">
            <SubmitButton className="btn-primary" pendingLabel="Creating…">
              Create invite
            </SubmitButton>
          </div>
        </ActionForm>
      </CollapsibleSection>

      <section className="mb-8" aria-labelledby="invites-title">
        <h2 id="invites-title" className="section-title mb-3">
          Invites <span className="text-base font-normal text-muted">({invites.length})</span>
        </h2>
        {invites.length === 0 ? (
          <EmptyState
            variant="inline"
            headingLevel="h3"
            icon="mail"
            title="No invites yet"
            description="Create one above, then copy its link and send it to the person you want to invite."
          />
        ) : (
          <ul className="card-flush divide-y divide-slate-100 dark:divide-slate-700">
            {invites.map((inv) => {
              const status = inviteStatus(inv, now);
              const label = inv.email ? `for ${inv.email}` : `created ${formatDate(inv.createdAt)}`;
              return (
                <li key={inv.id} className="flex items-center justify-between gap-2 px-4 py-3">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2">
                      <span className="break-all font-medium text-slate-800 dark:text-slate-100">
                        {inv.email ?? "Anyone with the link"}
                      </span>
                      {status === "expired" ? (
                        <span className="badge-muted">Expired</span>
                      ) : status === "used" ? (
                        <span className="badge-muted">Used</span>
                      ) : (
                        <span className="badge-success">Active</span>
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {inv.uses}/{inv.maxUses} used · created {formatDate(inv.createdAt)}
                      {inv.expiresAt && ` · ${status === "expired" ? "expired" : "expires"} ${formatDate(inv.expiresAt)}`}
                      {inv.usedBy && ` · joined as ${inv.usedBy.email}`}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center">
                    {status === "active" && <CopyCodeButton code={inv.code} label={label} />}
                    <ActionForm
                      action={deleteInvite}
                      confirm={{
                        title: "Delete this invite?",
                        message:
                          status === "active"
                            ? "The link will stop working. People who already joined with it keep their accounts."
                            : "This only removes it from the list. People who joined with it keep their accounts.",
                      }}
                    >
                      <input type="hidden" name="id" value={inv.id} />
                      <SubmitIconButton
                        className="btn-icon-danger"
                        icon={<Icon name="trash" className="h-4 w-4" />}
                        aria-label={`Delete invite ${label}`}
                      />
                    </ActionForm>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="users-title">
        <h2 id="users-title" className="section-title mb-3">
          Users <span className="text-base font-normal text-muted">({users.length})</span>
        </h2>
        <div className="card-flush">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <caption className="sr-only">Registered users</caption>
              <thead className="bg-slate-50 text-xs text-slate-600 dark:bg-slate-900/40 dark:text-slate-400">
                <tr>
                  <th scope="col" className="px-4 py-2.5 font-medium">Name</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">Email</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">Joined</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {users.map((u) => (
                  <tr key={u.id}>
                    <th scope="row" className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">
                      <span className="flex flex-wrap items-center gap-2">
                        {u.name ?? <span className="font-normal text-muted">No name</span>}
                        {u.role === "admin" && <span className="badge-brand">Admin</span>}
                      </span>
                    </th>
                    <td className="break-all px-4 py-3 text-slate-700 dark:text-slate-300">{u.email}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3">
                      <span className={u.emailVerifiedAt ? "badge-success" : "badge-warning"}>
                        {u.emailVerifiedAt ? "Active" : "Not activated"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
