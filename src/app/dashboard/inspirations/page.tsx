import { requireUser } from "@/lib/session";
import { getInspirations } from "@/lib/queries/inspirations";
import PageHeader from "@/components/PageHeader";
import SubmitButton from "@/components/SubmitButton";
import FormAction from "@/components/FormAction";
import EmptyState from "@/components/EmptyState";
import InspirationRow from "./InspirationRow";
import { createInspirationForm } from "./actions";

export default async function InspirationsPage() {
  const user = await requireUser();
  const inspirations = await getInspirations(user.id);

  return (
    <div>
      <PageHeader
        title="Inspirations"
        description="Quotes, wise words, and personal notes to revisit when you need motivation."
      />

      <FormAction
        action={createInspirationForm}
        successMessage="Inspiration added"
        className="card mb-6 space-y-3"
      >
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
        <SubmitButton className="btn-primary">Add inspiration</SubmitButton>
      </FormAction>

      {inspirations.length === 0 ? (
        <EmptyState
          icon="sparkles"
          title="Build your inspiration library"
          description="Save quotes and personal notes here. One will appear on your home page each time you visit."
          tip="Start with something that helped you recently."
        />
      ) : (
        <div className="space-y-3">
          {inspirations.map((item) => (
            <InspirationRow key={item.id} id={item.id} text={item.text} author={item.author} />
          ))}
        </div>
      )}
    </div>
  );
}
