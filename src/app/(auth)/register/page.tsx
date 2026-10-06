import Link from "next/link";
import { findUsableInvite } from "@/lib/invites";
import RegisterForm from "./RegisterForm";

export const metadata = { title: "Create account" };
export const dynamic = "force-dynamic";

export default async function RegisterPage({ searchParams }: { searchParams: { invite?: string | string[] } }) {
  const code = typeof searchParams.invite === "string" ? searchParams.invite : null;
  const invite = await findUsableInvite(code);

  if (!invite) {
    return (
      <div className="card">
        <h1 className="section-title">{code ? "This invite link can't be used" : "You need an invite link"}</h1>
        <p className="mb-4 mt-1 text-sm text-slate-600 dark:text-slate-400">
          {code
            ? "The link has expired or has already been used. Ask the person who invited you for a new one."
            : "Control is invite-only. Open the invite link you were sent to create your account."}
        </p>
        <Link href="/login" className="btn-ghost w-full">
          Back to sign in
        </Link>
      </div>
    );
  }

  return <RegisterForm inviteCode={invite.code} lockedEmail={invite.email} />;
}
