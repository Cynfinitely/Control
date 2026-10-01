"use client";

import { useEffect, useState } from "react";
import ActionForm from "@/components/ActionForm";
import FormField from "@/components/FormField";
import SegmentedControl from "@/components/SegmentedControl";
import SubmitButton from "@/components/SubmitButton";
import { createCardioWorkout, createGymWorkout } from "./actions";

type ActivityType = "gym" | "run" | "walk" | "swim" | "other";

const OPTIONS: { value: ActivityType; label: string }[] = [
  { value: "gym", label: "Gym" },
  { value: "run", label: "Run" },
  { value: "walk", label: "Walk" },
  { value: "swim", label: "Swim" },
  { value: "other", label: "Other" },
];

const STORAGE_KEY = "control:exercise:last-activity";

function isActivityType(value: unknown): value is ActivityType {
  return OPTIONS.some((o) => o.value === value);
}

function DateField({ defaultValue }: { defaultValue: string }) {
  return (
    <FormField label="Date">
      {(_id, aria) => <input {...aria} name="date" type="date" className="input" defaultValue={defaultValue} />}
    </FormField>
  );
}

function NotesField({ className }: { className?: string }) {
  return (
    <FormField
      label={
        <>
          Notes <span className="font-normal text-muted">(optional)</span>
        </>
      }
      className={className}
    >
      {(_id, aria) => <input {...aria} name="notes" className="input" />}
    </FormField>
  );
}

function DurationField({ placeholder }: { placeholder: string }) {
  return (
    <FormField label="Duration (min)">
      {(_id, aria) => (
        <input {...aria} name="durationMin" type="number" min={0} inputMode="numeric" className="input" placeholder={placeholder} />
      )}
    </FormField>
  );
}

/**
 * One card for logging any activity: a type switcher plus the matching fields.
 * Each type posts the same field names to the same server action as before.
 */
export default function LogActivityCard({ todayValue }: { todayValue: string }) {
  const [type, setType] = useState<ActivityType>("gym");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (isActivityType(saved)) setType(saved);
    } catch {
      /* storage unavailable */
    }
  }, []);

  function choose(next: ActivityType) {
    setType(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage unavailable */
    }
  }

  const grid = "mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2";

  return (
    <section className="card" aria-labelledby="log-activity-title">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 id="log-activity-title" className="section-title">
          Log activity
        </h2>
        <SegmentedControl options={OPTIONS} value={type} onChange={choose} aria-label="Activity type" />
      </div>

      {type === "gym" && (
        <ActionForm key="gym" action={createGymWorkout} className={grid}>
          <FormField label="Session name" className="sm:col-span-2" required>
            {(_id, aria) => (
              <input {...aria} name="name" className="input" placeholder="e.g. Push day" required />
            )}
          </FormField>
          <DateField defaultValue={todayValue} />
          <NotesField />
          <p className="hint sm:col-span-2">
            Creates the session and opens it so you can add exercises and sets. To reuse a saved routine, use
            “Start workout” on a program above.
          </p>
          <div className="sm:col-span-2">
            <SubmitButton className="btn-primary touch-target">Create &amp; add exercises</SubmitButton>
          </div>
        </ActionForm>
      )}

      {type === "run" && (
        <ActionForm key="run" action={createCardioWorkout} successMessage="Run logged" resetOnSuccess className={grid}>
          <input type="hidden" name="activityType" value="run" />
          <FormField label="Distance (km)">
            {(_id, aria) => (
              <input {...aria} name="distanceKm" type="number" step="any" min={0} inputMode="decimal" className="input" placeholder="5" />
            )}
          </FormField>
          <DurationField placeholder="28" />
          <DateField defaultValue={todayValue} />
          <NotesField />
          <div className="sm:col-span-2">
            <SubmitButton className="btn-primary touch-target">Log run</SubmitButton>
          </div>
        </ActionForm>
      )}

      {type === "walk" && (
        <ActionForm key="walk" action={createCardioWorkout} successMessage="Walk logged" resetOnSuccess className={grid}>
          <input type="hidden" name="activityType" value="walk" />
          <FormField label="Type">
            {(_id, aria) => (
              <select {...aria} name="walkKind" className="input" defaultValue="outdoor">
                <option value="outdoor">Outdoor</option>
                <option value="indoor">Indoor</option>
              </select>
            )}
          </FormField>
          <DurationField placeholder="30" />
          <FormField
            label={
              <>
                Distance (km) <span className="font-normal text-muted">(optional)</span>
              </>
            }
          >
            {(_id, aria) => (
              <input {...aria} name="distanceKm" type="number" step="any" min={0} inputMode="decimal" className="input" placeholder="3" />
            )}
          </FormField>
          <DateField defaultValue={todayValue} />
          <NotesField className="sm:col-span-2" />
          <div className="sm:col-span-2">
            <SubmitButton className="btn-primary touch-target">Log walk</SubmitButton>
          </div>
        </ActionForm>
      )}

      {type === "swim" && (
        <ActionForm key="swim" action={createCardioWorkout} successMessage="Swim logged" resetOnSuccess className={grid}>
          <input type="hidden" name="activityType" value="swim" />
          <FormField label="Distance (m)">
            {(_id, aria) => (
              <input {...aria} name="distanceM" type="number" min={0} inputMode="numeric" className="input" placeholder="1500" />
            )}
          </FormField>
          <DurationField placeholder="35" />
          <DateField defaultValue={todayValue} />
          <NotesField />
          <div className="sm:col-span-2">
            <SubmitButton className="btn-primary touch-target">Log swim</SubmitButton>
          </div>
        </ActionForm>
      )}

      {type === "other" && (
        <ActionForm key="other" action={createCardioWorkout} successMessage="Activity logged" resetOnSuccess className={grid}>
          <input type="hidden" name="activityType" value="other" />
          <FormField label="Activity" className="sm:col-span-2" required>
            {(_id, aria) => (
              <input {...aria} name="description" className="input" placeholder="e.g. Yoga" required />
            )}
          </FormField>
          <DurationField placeholder="45" />
          <DateField defaultValue={todayValue} />
          <div className="sm:col-span-2">
            <SubmitButton className="btn-primary touch-target">Log activity</SubmitButton>
          </div>
        </ActionForm>
      )}
    </section>
  );
}
