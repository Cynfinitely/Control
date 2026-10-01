"use client";

import { useRouter } from "next/navigation";
import ActionForm from "@/components/ActionForm";
import Icon from "@/components/Icon";
import SubmitButton from "@/components/SubmitButton";
import { deleteWorkout } from "../actions";

/** Delete the whole workout from its detail page, then go back to the list. */
export default function DeleteWorkoutButton({ id, name, isGym }: { id: string; name: string; isGym: boolean }) {
  const router = useRouter();
  return (
    <ActionForm
      action={deleteWorkout}
      confirm={{
        title: `Delete “${name}”?`,
        message: isGym
          ? "The session and all its exercises and sets will be removed."
          : "This workout will be removed from your log.",
      }}
      onSuccess={() => router.push("/dashboard/exercise")}
    >
      <input type="hidden" name="id" value={id} />
      <SubmitButton className="btn-danger touch-target w-full sm:w-auto">
        <Icon name="trash" className="h-4 w-4" />
        Delete workout
      </SubmitButton>
    </ActionForm>
  );
}
