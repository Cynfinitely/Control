import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { formatDate } from "@/lib/date";
import PageHeader from "@/components/PageHeader";
import Icon from "@/components/Icon";
import SubmitButton from "@/components/SubmitButton";
import SubmitIconButton from "@/components/SubmitIconButton";
import { createInvite, deleteInvite } from "./actions";

export default async function AdminPage() {
  await requireAdmin();

  const [invites, users] = await Promise.all([
    prisma.inviteCode.findMany({ orderBy: { createdAt: "desc" }, include: { usedBy: true } }),
    prisma.user.findMany({ orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <div>
      <PageHeader title="Admin" description="Manage invite codes and view registered users." />

      <details className="card mb-6" open>
        <summary className="cursor-pointer font-medium text-brand-700">+ Create invite code</summary>
        <form action={createInvite} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Custom code (optional)</label>
            <input name="code" className="input" placeholder="auto-generated if blank" />
          </div>
          <div>
            <label className="label">Lock to email (optional)</label>
            <input name="email" type="email" className="input" />
          </div>
          <div>
            <label className="label">Max uses</label>
            <input name="maxUses" type="number" min={1} className="input" defaultValue={1} />
          </div>
          <div>
            <label className="label">Expires (optional)</label>
            <input name="expiresAt" type="date" className="input" />
          </div>
          <div className="sm:col-span-2">
            <SubmitButton className="btn-primary">Create invite</SubmitButton>
          </div>
        </form>
      </details>

      <h2 className="section-title mb-3">Invite codes</h2>
      <div className="mb-8 space-y-2">
        {invites.map((inv) => {
          const exhausted = inv.uses >= inv.maxUses;
          const expired = inv.expiresAt && inv.expiresAt < new Date();
          return (
            <div key={inv.id} className="card flex items-center justify-between py-3">
              <div>
                <p className="font-mono font-medium text-slate-800">{inv.code}</p>
                <p className="text-xs text-slate-400">
                  {inv.uses}/{inv.maxUses} used
                  {inv.email && ` · for ${inv.email}`}
                  {inv.expiresAt && ` · expires ${formatDate(inv.expiresAt)}`}
                  {inv.usedBy && ` · claimed by ${inv.usedBy.email}`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {(exhausted || expired) && (
                  <span className="badge bg-slate-100 text-slate-500">
                    {expired ? "expired" : "used up"}
                  </span>
                )}
                <form action={deleteInvite}>
                  <input type="hidden" name="id" value={inv.id} />
                  <SubmitIconButton
                    className="text-slate-300 hover:text-red-500"
                    icon={<Icon name="trash" className="h-4 w-4" />}
                  />
                </form>
              </div>
            </div>
          );
        })}
      </div>

      <h2 className="section-title mb-3">Users ({users.length})</h2>
      <div className="space-y-2">
        {users.map((u) => (
          <div key={u.id} className="card flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-slate-800">
                {u.name ?? "(no name)"}
                {u.role === "admin" && <span className="ml-2 badge bg-brand-100 text-brand-700">admin</span>}
              </p>
              <p className="text-xs text-slate-400">{u.email}</p>
            </div>
            <span
              className={`badge ${
                u.emailVerifiedAt ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
              }`}
            >
              {u.emailVerifiedAt ? "verified" : "unverified"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
