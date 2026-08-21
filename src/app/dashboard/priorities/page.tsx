import { requireUser } from "@/lib/session";
import { getLifePriorities } from "@/lib/queries/priorities";
import PageHeader from "@/components/PageHeader";
import PrioritiesManager from "./PrioritiesManager";

export default async function PrioritiesPage() {
  const user = await requireUser();
  const priorities = await getLifePriorities(user.id);

  return (
    <div>
      <PageHeader
        title="Priorities"
        description="The order of your life. Rank what you serve first so every other list has a north star."
      />
      <PrioritiesManager priorities={priorities} />
    </div>
  );
}
