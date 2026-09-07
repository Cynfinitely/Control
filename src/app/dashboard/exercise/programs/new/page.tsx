import PageHeader from "@/components/PageHeader";
import Breadcrumb from "@/components/Breadcrumb";
import SubmitButton from "@/components/SubmitButton";
import { createProgram } from "../actions";
import ProgramTextImport from "../ProgramTextImport";

export default function NewWorkoutProgramPage() {
  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Exercise", href: "/dashboard/exercise" },
          { label: "New program" },
        ]}
      />
      <PageHeader
        title="New program"
        description="Save a reusable gym session, or paste a list of exercises."
      />

      <div className="card mb-6">
        <h2 className="section-title">Create empty program</h2>
        <form action={createProgram} className="mt-3 grid grid-cols-1 gap-3">
          <div>
            <label className="label" htmlFor="program-name">
              Name
            </label>
            <input id="program-name" name="name" className="input" placeholder="e.g. Full Body" required />
          </div>
          <div>
            <label className="label" htmlFor="program-notes">
              Notes (optional)
            </label>
            <input id="program-notes" name="notes" className="input" placeholder="optional" />
          </div>
          <SubmitButton className="btn-primary touch-target">Create program</SubmitButton>
        </form>
      </div>

      <ProgramTextImport />
    </div>
  );
}
