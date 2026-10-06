"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Spinner from "@/components/Spinner";
import FormField from "@/components/FormField";
import PasswordInput from "@/components/PasswordInput";

export default function RegisterForm({ inviteCode, lockedEmail }: { inviteCode: string; lockedEmail: string | null }) {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: lockedEmail ?? "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, inviteCode }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }
      const signedIn = await signIn("credentials", { email: form.email, password: form.password, redirect: false });
      if (signedIn?.error) {
        router.push("/login");
        return;
      }
      // First visit to the dashboard sends a new account through setup.
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h1 className="section-title">Create account</h1>
      <p className="mb-4 mt-1 text-sm text-slate-600 dark:text-slate-400">
        You have been invited to Control. Your account starts empty and everything you add is visible only to you.
      </p>
      {error && (
        <p role="alert" className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}
      <form onSubmit={onSubmit} className="space-y-4">
        <FormField label="Name">
          {(id) => (
            <input id={id} className="input" value={form.name} onChange={update("name")} required autoComplete="name" autoFocus />
          )}
        </FormField>
        <FormField label="Email" hint={lockedEmail ? "This invite was made for this address." : undefined}>
          {(id, aria) => (
            <input
              {...aria}
              id={id}
              className="input"
              type="email"
              value={form.email}
              onChange={update("email")}
              readOnly={Boolean(lockedEmail)}
              required
              autoComplete="email"
            />
          )}
        </FormField>
        <FormField label="Password" hint="At least 8 characters.">
          {(id, aria) => (
            <PasswordInput
              {...aria}
              id={id}
              value={form.password}
              onChange={update("password")}
              minLength={8}
              required
              autoComplete="new-password"
            />
          )}
        </FormField>
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading && <Spinner />}
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-600 dark:text-slate-400">
        Already have an account?{" "}
        <Link href="/login" className="link">
          Sign in
        </Link>
      </p>
    </div>
  );
}
