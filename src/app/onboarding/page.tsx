import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getModuleState } from "@/lib/queries/modules";
import OnboardingForm from "./OnboardingForm";

export const metadata = { title: "Welcome" };

export default async function OnboardingPage() {
  const user = await requireUser();
  const state = await getModuleState(user.id);
  if (!state.needsOnboarding) redirect("/dashboard");

  return <OnboardingForm name={user.name ?? ""} disabled={state.disabled} />;
}
