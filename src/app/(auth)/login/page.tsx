"use client";

import { Suspense, useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Spinner from "@/components/Spinner";
import FormField from "@/components/FormField";
import PasswordInput from "@/components/PasswordInput";

const VERIFY_ERRORS: Record<string, string> = {
  missing_token: "This verification link is missing a token. Check the link from your email.",
  invalid_token: "This verification link is invalid or has expired. Please register again or contact support.",
};

function Alert({ tone, children }: { tone: "error" | "success"; children: React.ReactNode }) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={
        tone === "error"
          ? "mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
          : "mb-4 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-300"
      }
    >
      {children}
    </p>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { status } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const verified = params.get("verified");
  const verifyError = params.get("error");

  useEffect(() => {
    if (status === "authenticated") router.replace("/dashboard");
  }, [status, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await signIn("credentials", { email, password, redirect: false });
      if (res?.error) {
        setError(
          res.error === "EMAIL_NOT_VERIFIED"
            ? "Please verify your email before signing in."
            : "Invalid email or password."
        );
        setLoading(false);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h1 className="section-title mb-4">Sign in</h1>
      {verified && <Alert tone="success">Email verified. You can sign in now.</Alert>}
      {verifyError && VERIFY_ERRORS[verifyError] && <Alert tone="error">{VERIFY_ERRORS[verifyError]}</Alert>}
      {error && <Alert tone="error">{error}</Alert>}
      <form onSubmit={onSubmit} className="space-y-4">
        <FormField label="Email">
          {(id) => (
            <input
              id={id}
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus
            />
          )}
        </FormField>
        <FormField label="Password">
          {(id) => (
            <PasswordInput
              id={id}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          )}
        </FormField>
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading && <Spinner />}
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-600 dark:text-slate-400">
        New here? Control is invite-only: open the invite link you were sent to create your account.
      </p>
    </div>
  );
}

function LoginSkeleton() {
  return (
    <div className="card space-y-4" role="status" aria-busy="true">
      <span className="sr-only">Loading…</span>
      <div className="skeleton h-6 w-24" />
      <div className="skeleton h-10 w-full" />
      <div className="skeleton h-10 w-full" />
      <div className="skeleton h-10 w-full" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginForm />
    </Suspense>
  );
}
