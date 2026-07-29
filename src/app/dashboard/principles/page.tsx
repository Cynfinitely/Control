import { requireUser } from "@/lib/session";
import { getActivePrinciples, getPrincipleReviewedToday } from "@/lib/queries/principles";
import PageHeader from "@/components/PageHeader";
import PrinciplesView from "./PrinciplesView";

export default async function PrinciplesPage() {
  const user = await requireUser();
  const [principles, reviewedToday] = await Promise.all([
    getActivePrinciples(user.id),
    getPrincipleReviewedToday(user.id),
  ]);

  return (
    <div>
      <PageHeader
        title="Principles"
        description="Read your guardrails as one list. Use Manage only when you need to change them."
      />
      <PrinciplesView principles={principles} reviewedToday={reviewedToday} />
    </div>
  );
}
