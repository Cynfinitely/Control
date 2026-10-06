import PageHeader from "@/components/PageHeader";
import Breadcrumb from "@/components/Breadcrumb";
import ActionForm from "@/components/ActionForm";
import SubmitButton from "@/components/SubmitButton";
import { requireModule } from "@/lib/session";
import { createProgram } from "../actions";
import ProgramTextImport from "../ProgramTextImport";

export const metadata = { title: "New program" };

export default async function NewWorkoutProgramPage() {
  await requireModule("exercise");
  return (
    <div>
      <PageHeader help="exercise:program-new"
        breadcrumb={
          <Breadcrumb
            items={[
              { label: "Exercise", href: "/dashboard/exercise" },
              { label: "New program" },
            ]}
          />
        }
        title="New program"
        description="Save a reusable gym session, or paste a list of exercises."
      />

      <section className="card mb-6" aria-labelledby="create-program-title">
        <h2 id="create-program-title" className="section-title">
          Create empty program
        </h2>
        <ActionForm action={createProgram} className="mt-3 grid grid-cols-1 gap-3">
          <div>
            <label className="label" htmlFor="program-name">
              Name
            </label>
            <input id="program-name" name="name" className="input" placeholder="e.g. Full Body" required />
          </div>
          <div>
            <label className="label" htmlFor="program-notes">
              Notes <span className="font-normal text-muted">(optional)</span>
            </label>
            <input id="program-notes" name="notes" className="input" />
          </div>
          <div>
            <SubmitButton className="btn-primary touch-target w-full sm:w-auto">Create program</SubmitButton>
          </div>
        </ActionForm>
      </section>

      <ProgramTextImport />
    </div>
  );
}
