"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const verified = params.get("verified");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
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
        <p className="mb-3 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
          Email verified. You can sign in now.
        </p>
      )}
      {error && (
        <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="label">Email</label>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label">Password</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button className="btn-primary w-full" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
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
