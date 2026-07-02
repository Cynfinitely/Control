"use client";

import { useEffect, useRef } from "react";
import { useFormState } from "react-dom";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import SubmitButton from "@/components/SubmitButton";
import { TIMEZONES, isValidTimezone } from "@/lib/timezones";
import {
  updateProfile,
  changePassword,
  type ActionState,
} from "./actions";

const initialState: ActionState = {};

function FormMessage({ state }: { state: ActionState }) {
  if (state.error) {
    return (
      <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
    );
  }
  if (state.ok) {
    return (
      <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
        Saved successfully.
      </p>
    );
  }
  return null;
}

export function ProfileForm({
  name,
  email,
  timezone,
}: {
  name: string;
  email: string;
  timezone: string;
}) {
  const { update } = useSession();
  const router = useRouter();
  const [state, formAction] = useFormState(updateProfile, initialState);
  const timezoneOptions = isValidTimezone(timezone) ? TIMEZONES : [timezone, ...TIMEZONES];

  useEffect(() => {
    if (state.ok && state.name) {
      void update({ name: state.name }).then(() => router.refresh());
    }
  }, [state.ok, state.name, update, router]);

  return (
    <form action={formAction} className="card space-y-4">
      <h2 className="section-title">Profile</h2>
      <FormMessage state={state} />
      <div>
        <label className="label" htmlFor="name">
          Display name
        </label>
        <input
          id="name"
          name="name"
          className="input"
          defaultValue={name}
          required
          maxLength={80}
        />
      </div>
      <div>
        <label className="label" htmlFor="timezone">
          Timezone
        </label>
        <select id="timezone" name="timezone" className="input" defaultValue={timezone}>
          {timezoneOptions.map((tz) => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="email">
          Email
        </label>
        <input id="email" className="input bg-slate-50 text-slate-500" value={email} disabled />
        <p className="mt-1 text-xs text-slate-400">Email cannot be changed.</p>
      </div>
      <SubmitButton className="btn-primary touch-target">Save profile</SubmitButton>
    </form>
  );
}

export function PasswordForm() {
  const [state, formAction] = useFormState(changePassword, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
    }
  }, [state.ok]);

  return (
    <form ref={formRef} action={formAction} className="card space-y-4">
      <h2 className="section-title">Password</h2>
      <FormMessage state={state} />
      <div>
        <label className="label" htmlFor="currentPassword">
          Current password
        </label>
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          className="input"
          autoComplete="current-password"
          required
        />
      </div>
      <div>
        <label className="label" htmlFor="newPassword">
          New password
        </label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          className="input"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>
      <div>
        <label className="label" htmlFor="confirmPassword">
          Confirm new password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          className="input"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>
      <SubmitButton className="btn-primary touch-target">Change password</SubmitButton>
    </form>
  );
}
