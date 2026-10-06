import { requireModule } from "@/lib/session";
import { getInspirations } from "@/lib/queries/inspirations";
import PageHeader from "@/components/PageHeader";
import SubmitButton from "@/components/SubmitButton";
import FormAction from "@/components/FormAction";
import EmptyState from "@/components/EmptyState";
import InspirationRow from "./InspirationRow";
import { createInspirationForm } from "./actions";

export const metadata = { title: "Inspirations" };

export default async function InspirationsPage() {
  const user = await requireModule("inspirations");
  const inspirations = await getInspirations(user.id);

  return (
    <div>
      <PageHeader help="inspirations"
        title="Inspirations"
        description="Quotes, wise words, and personal notes to revisit when you need motivation."
      />

      <FormAction
        action={createInspirationForm}
        successMessage="Inspiration added"
        resetOnSuccess
        className="card mb-6 space-y-3"
      >
        <h2 className="section-title">Add an inspiration</h2>
        <div>
          <label htmlFor="inspiration-text" className="label">
            Text
          </label>
          <textarea
            id="inspiration-text"
            name="text"
            className="input"
            rows={3}
            placeholder="A quote or note that motivates you…"
            required
          />
        </div>
        <div>
          <label htmlFor="inspiration-author" className="label">
            Author (optional)
          </label>
          <input
            id="inspiration-author"
            name="author"
            className="input"
            placeholder="e.g. Seneca, a mentor, or yourself"
          />
        </div>
        <SubmitButton className="btn-primary" pendingLabel="Adding…">
          Add inspiration
        </SubmitButton>
      </FormAction>

      {inspirations.length === 0 ? (
        <EmptyState
          icon="sparkles"
          title="Build your inspiration library"
          description="Save quotes and personal notes here. One will appear on your home page each time you visit."
        />
      ) : (
        <section aria-labelledby="inspirations-list-title">
          <h2 id="inspirations-list-title" className="section-title mb-3">
            Your library <span className="text-base font-normal text-muted">({inspirations.length})</span>
          </h2>
          <ul className="card-flush divide-y divide-slate-100 dark:divide-slate-700">
            {inspirations.map((item) => (
              <InspirationRow key={item.id} id={item.id} text={item.text} author={item.author} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
