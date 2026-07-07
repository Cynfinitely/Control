"use client";

import { Suspense, useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Spinner from "@/components/Spinner";
import FormField from "@/components/FormField";

const VERIFY_ERRORS: Record<string, string> = {
  missing_token: "This verification link is missing a token. Check the link from your email.",
  invalid_token: "This verification link is invalid or has expired. Please register again or contact support.",
};

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
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    if (res?.error) {
      setLoading(false);
      setError(
        res.error === "EMAIL_NOT_VERIFIED"
          ? "Please verify your email before signing in."
          : "Invalid email or password."
      );
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="card">
      <h2 className="section-title mb-4">Sign in</h2>
      {verified && (
        <p className="mb-3 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
          Email verified. You can sign in now.
        </p>
      )}
      {verifyError && VERIFY_ERRORS[verifyError] && (
        <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {VERIFY_ERRORS[verifyError]}
        </p>
      )}
      {error && (
        <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{error}</p>
      )}
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
            />
          )}
        </FormField>
        <FormField label="Password">
          {(id) => (
            <input
              id={id}
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          )}
        </FormField>
        <button className="btn-primary w-full" disabled={loading}>
          {loading ? (
            <>
              <Spinner />
              Signing in...
            </>
          ) : (
            "Sign in"
          )}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-500">
        Have an invite?{" "}
        <Link href="/register" className="font-medium text-brand-600 hover:underline">
          Create account
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="card">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
