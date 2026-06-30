"use client";

import { useState } from "react";
import Link from "next/link";
import Spinner from "@/components/Spinner";

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    inviteCode: "",
  });
  const [error, setError] = useState("");
  const [verifyUrl, setVerifyUrl] = useState("");
  const [loading, setLoading] = useState(false);

  function update(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Something went wrong.");
      return;
    }
    setVerifyUrl(data.verifyUrl);
  }

  if (verifyUrl) {
    return (
      <div className="card">
        <h2 className="section-title mb-2">Verify your email</h2>
        <p className="mb-4 text-sm text-slate-600">
          Email verification is required. No email service is configured in this version,
          so use the link below to verify your account directly.
        </p>
        <Link href={verifyUrl} className="btn-primary w-full">
          Verify my email
        </Link>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="section-title mb-4">Create account</h2>
      <p className="mb-4 text-sm text-slate-500">
        Registration is invite-only. Enter the invite code you received.
      </p>
      {error && (
        <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="label">Name</label>
          <input className="input" value={form.name} onChange={update("name")} required />
        </div>
        <div>
          <label className="label">Email</label>
          <input
            className="input"
            type="email"
            value={form.email}
            onChange={update("email")}
            required
          />
        </div>
        <div>
          <label className="label">Password</label>
          <input
            className="input"
            type="password"
            value={form.password}
            onChange={update("password")}
            minLength={8}
            required
          />
          <p className="mt-1 text-xs text-slate-400">At least 8 characters.</p>
        </div>
        <div>
          <label className="label">Invite code</label>
          <input
            className="input"
            value={form.inviteCode}
            onChange={update("inviteCode")}
            required
          />
        </div>
        <button className="btn-primary w-full" disabled={loading}>
          {loading ? (
            <>
              <Spinner />
              Creating...
            </>
          ) : (
            "Create account"
          )}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-brand-600 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
