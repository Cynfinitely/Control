import { requireUser } from "@/lib/session";
import { getActivePrinciples, getPrincipleReviewedToday } from "@/lib/queries/principles";
import {
  PRINCIPLE_CATEGORY_LABELS,
  PRINCIPLE_CATEGORY_ORDER,
} from "@/lib/principles/seed";
import PageHeader from "@/components/PageHeader";
import SubmitButton from "@/components/SubmitButton";
import FormAction from "@/components/FormAction";
import PrinciplesList from "./PrinciplesList";
import PrinciplesReviewButton from "./PrinciplesReviewButton";
import { createPrincipleForm } from "./actions";

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
        description="Behavioral guardrails to review regularly. One daily check — not a checklist of every item."
        action={
          reviewedToday ? (
            <p className="text-sm font-medium text-green-600 dark:text-green-400">
              Reviewed today ✓
            </p>
          ) : (
            <PrinciplesReviewButton />
          )
        }
      />

      <FormAction
        action={createPrincipleForm}
        successMessage="Principle added"
        className="card mb-6 space-y-3"
      >
        <div>
          <label htmlFor="principle-text" className="label">
            Text
          </label>
          <textarea
            id="principle-text"
            name="text"
            className="input"
            rows={2}
            placeholder="A principle or guardrail…"
            required
          />
        </div>
        <div>
          <label htmlFor="principle-category" className="label">
            Category
          </label>
          <select
            id="principle-category"
            name="category"
            className="input"
            required
            defaultValue="environment"
          >
            {PRINCIPLE_CATEGORY_ORDER.map((cat) => (
              <option key={cat} value={cat}>
                {PRINCIPLE_CATEGORY_LABELS[cat]}
              </option>
            ))}
          </select>
        </div>
        <SubmitButton className="btn-primary">Add principle</SubmitButton>
      </FormAction>

      <PrinciplesList principles={principles} />
    </div>
  );
}
