"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState } from "react-dom";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import SubmitButton from "@/components/SubmitButton";
import PasswordInput from "@/components/PasswordInput";
import { useToast } from "@/components/Toast";
import { TIMEZONES, isValidTimezone } from "@/lib/timezones";
import {
  updateProfile,
  changePassword,
  type ActionState,
} from "./actions";

const initialState: ActionState = {};

/** Inline error banner (success is announced with a toast instead). */
function FormMessage({ state }: { state: ActionState }) {
  if (!state.error) return null;
  return (
    <p
      role="alert"
      className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
    >
      {state.error}
    </p>
  );
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
  const toast = useToast();
  const [state, formAction] = useFormState(updateProfile, initialState);
  const timezoneOptions = isValidTimezone(timezone) ? TIMEZONES : [timezone, ...TIMEZONES];

  useEffect(() => {
    if (!state.ok) return;
    toast.success("Profile saved");
    if (state.name) {
      void update({ name: state.name }).then(() => router.refresh());
    }
    // Runs once per submission result (useFormState returns a new object each time).
  }, [state]);

  return (
    <form action={formAction} className="card flex flex-col gap-4">
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
          autoComplete="name"
        />
      </div>
      <div>
        <label className="label" htmlFor="timezone">
          Timezone
        </label>
        <select id="timezone" name="timezone" className="input" defaultValue={timezone} aria-describedby="timezone-hint">
          {timezoneOptions.map((tz) => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
        </select>
        <p id="timezone-hint" className="hint">
          Used for your greeting, calendar events, reminders, and when notifications fire.
        </p>
      </div>
      <div>
        <label className="label" htmlFor="email">
          Email
        </label>
        <input id="email" className="input" value={email} disabled aria-describedby="email-hint" />
        <p id="email-hint" className="hint">
          Email cannot be changed.
        </p>
      </div>
      <SubmitButton className="btn-primary touch-target" pendingLabel="Saving…">
        Save profile
      </SubmitButton>
    </form>
  );
}

export function PasswordForm() {
  const [state, formAction] = useFormState(changePassword, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const toast = useToast();
  const [mismatch, setMismatch] = useState(false);

  useEffect(() => {
    if (!state.ok) return;
    toast.success("Password changed");
    formRef.current?.reset();
  }, [state]);

  function passwordsMatch(form: HTMLFormElement) {
    const fd = new FormData(form);
    return fd.get("newPassword") === fd.get("confirmPassword");
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="card flex flex-col gap-4"
      onSubmit={(e) => {
        if (!passwordsMatch(e.currentTarget)) {
          e.preventDefault();
          setMismatch(true);
          e.currentTarget.querySelector<HTMLInputElement>("#confirmPassword")?.focus();
        }
      }}
      onChange={(e) => {
        if (mismatch && passwordsMatch(e.currentTarget)) setMismatch(false);
      }}
    >
      <h2 className="section-title">Password</h2>
      <FormMessage state={state} />
      <div>
        <label className="label" htmlFor="currentPassword">
          Current password
        </label>
        <PasswordInput
          id="currentPassword"
          name="currentPassword"
          autoComplete="current-password"
          required
        />
      </div>
      <div>
        <label className="label" htmlFor="newPassword">
          New password
        </label>
        <PasswordInput
          id="newPassword"
          name="newPassword"
          autoComplete="new-password"
          minLength={8}
          required
          aria-describedby="newPassword-hint"
        />
        <p id="newPassword-hint" className="hint">
          At least 8 characters.
        </p>
      </div>
      <div>
        <label className="label" htmlFor="confirmPassword">
          Confirm new password
        </label>
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          autoComplete="new-password"
          minLength={8}
          required
          aria-invalid={mismatch || undefined}
          aria-describedby={mismatch ? "confirmPassword-error" : undefined}
        />
        {mismatch && (
          <p id="confirmPassword-error" className="field-error" role="alert">
            The new passwords don&apos;t match.
          </p>
        )}
      </div>
      <SubmitButton className="btn-primary touch-target" pendingLabel="Changing…">
        Change password
      </SubmitButton>
    </form>
  );
}
