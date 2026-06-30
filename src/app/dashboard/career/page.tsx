import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { toDateInputValue, formatDate } from "@/lib/date";
import PageHeader from "@/components/PageHeader";
import Icon from "@/components/Icon";
import SubmitButton from "@/components/SubmitButton";
import SubmitIconButton from "@/components/SubmitIconButton";
import {
  createCareerGoal,
  setCareerGoalStatus,
  deleteCareerGoal,
  createSkill,
  updateSkillLevel,
  deleteSkill,
  createCertification,
  deleteCertification,
  createWorkExperience,
  deleteWorkExperience,
  createLearning,
  deleteLearning,
} from "./actions";

export default async function CareerPage() {
  const user = await requireUser();
  const userId = user.id;
  const now = new Date();

  const [goals, skills, certs, experiences, learning] = await Promise.all([
    prisma.careerGoal.findMany({ where: { userId, deletedAt: null }, orderBy: { createdAt: "desc" } }),
    prisma.skill.findMany({ where: { userId, deletedAt: null }, orderBy: { name: "asc" } }),
    prisma.certification.findMany({ where: { userId, deletedAt: null }, orderBy: { issuedAt: "desc" } }),
    prisma.workExperience.findMany({ where: { userId, deletedAt: null }, orderBy: { startDate: "desc" } }),
    prisma.learningEntry.findMany({ where: { userId, deletedAt: null }, orderBy: { date: "desc" }, take: 20 }),
  ]);

  return (
    <div>
      <PageHeader title="Career" description="Track goals, skills, certifications, work history, and learning." />

      {/* Career goals */}
      <section className="mb-8">
        <h2 className="section-title mb-3">Career goals</h2>
        <details className="card mb-3">
          <summary className="cursor-pointer font-medium text-brand-700">+ Add goal</summary>
          <form action={createCareerGoal} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label">Title</label>
              <input name="title" className="input" required />
            </div>
            <div>
              <label className="label">Target date</label>
              <input name="targetDate" type="date" className="input" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Description</label>
              <textarea name="description" className="input" rows={2} />
            </div>
            <div className="sm:col-span-2">
              <SubmitButton className="btn-primary">Add goal</SubmitButton>
            </div>
          </form>
        </details>
        <div className="space-y-2">
          {goals.length === 0 && <p className="text-sm text-slate-400">No career goals yet.</p>}
          {goals.map((g) => (
            <div key={g.id} className="card flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-slate-800">
                  {g.title}
                  <span className="ml-2 badge bg-slate-100 text-slate-500">{g.status}</span>
                </p>
                {g.description && <p className="mt-1 text-sm text-slate-500">{g.description}</p>}
                {g.targetDate && <p className="mt-1 text-xs text-slate-400">Target: {formatDate(g.targetDate)}</p>}
              </div>
              <div className="flex items-center gap-2">
                {g.status === "active" && (
                  <form action={setCareerGoalStatus}>
                    <input type="hidden" name="id" value={g.id} />
                    <input type="hidden" name="status" value="completed" />
                    <SubmitButton className="text-xs text-brand-600 hover:underline">Complete</SubmitButton>
                  </form>
                )}
                <form action={deleteCareerGoal}>
                  <input type="hidden" name="id" value={g.id} />
                  <SubmitIconButton
                    className="text-slate-300 hover:text-red-500"
                    icon={<Icon name="trash" className="h-4 w-4" />}
                  />
                </form>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Skills */}
      <section className="mb-8">
        <h2 className="section-title mb-3">Skills</h2>
        <details className="card mb-3">
          <summary className="cursor-pointer font-medium text-brand-700">+ Add skill</summary>
          <form action={createSkill} className="mt-4 flex flex-wrap items-end gap-3">
            <div>
              <label className="label">Skill</label>
              <input name="name" className="input" required />
            </div>
            <div>
              <label className="label">Level (1-5)</label>
              <input name="level" type="number" min={1} max={5} className="input w-24" defaultValue={3} />
            </div>
            <div className="flex-1">
              <label className="label">Notes</label>
              <input name="notes" className="input" />
            </div>
            <SubmitButton className="btn-primary">Add</SubmitButton>
          </form>
        </details>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {skills.map((s) => (
            <div key={s.id} className="card flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-slate-800">{s.name}</p>
                <div className="mt-1 flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <span
                      key={n}
                      className={`h-2 w-6 rounded-full ${n <= s.level ? "bg-brand-500" : "bg-slate-200"}`}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <form action={updateSkillLevel} className="flex items-center gap-1">
                  <input type="hidden" name="id" value={s.id} />
                  <input name="level" type="number" min={1} max={5} defaultValue={s.level} className="input w-16 py-1" />
                  <SubmitButton className="text-xs text-brand-600 hover:underline">Set</SubmitButton>
                </form>
                <form action={deleteSkill}>
                  <input type="hidden" name="id" value={s.id} />
                  <SubmitIconButton
                    className="text-slate-300 hover:text-red-500"
                    icon={<Icon name="trash" className="h-4 w-4" />}
                  />
                </form>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Certifications */}
      <section className="mb-8">
        <h2 className="section-title mb-3">Certifications</h2>
        <details className="card mb-3">
          <summary className="cursor-pointer font-medium text-brand-700">+ Add certification</summary>
          <form action={createCertification} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Name</label>
              <input name="name" className="input" required />
            </div>
            <div>
              <label className="label">Issuer</label>
              <input name="issuer" className="input" />
            </div>
            <div>
              <label className="label">Issued</label>
              <input name="issuedAt" type="date" className="input" />
            </div>
            <div>
              <label className="label">Expires</label>
              <input name="expiresAt" type="date" className="input" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Credential ID</label>
              <input name="credentialId" className="input" />
            </div>
            <div className="sm:col-span-2">
              <SubmitButton className="btn-primary">Add</SubmitButton>
            </div>
          </form>
        </details>
        <div className="space-y-2">
          {certs.map((c) => (
            <div key={c.id} className="card flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-slate-800">{c.name}</p>
                <p className="text-xs text-slate-400">
                  {c.issuer ?? "-"}
                  {c.issuedAt && ` · issued ${formatDate(c.issuedAt)}`}
                  {c.expiresAt && ` · expires ${formatDate(c.expiresAt)}`}
                </p>
              </div>
              <form action={deleteCertification}>
                <input type="hidden" name="id" value={c.id} />
                <SubmitIconButton
                  className="text-slate-300 hover:text-red-500"
                  icon={<Icon name="trash" className="h-4 w-4" />}
                />
              </form>
            </div>
          ))}
        </div>
      </section>

      {/* Work experience */}
      <section className="mb-8">
        <h2 className="section-title mb-3">Work history</h2>
        <details className="card mb-3">
          <summary className="cursor-pointer font-medium text-brand-700">+ Add experience</summary>
          <form action={createWorkExperience} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Company</label>
              <input name="company" className="input" required />
            </div>
            <div>
              <label className="label">Role</label>
              <input name="role" className="input" required />
            </div>
            <div>
              <label className="label">Start</label>
              <input name="startDate" type="date" className="input" />
            </div>
            <div>
              <label className="label">End</label>
              <input name="endDate" type="date" className="input" />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input name="current" type="checkbox" /> Current role
            </label>
            <div className="sm:col-span-2">
              <label className="label">Summary</label>
              <textarea name="summary" className="input" rows={2} />
            </div>
            <div className="sm:col-span-2">
              <SubmitButton className="btn-primary">Add</SubmitButton>
            </div>
          </form>
        </details>
        <div className="space-y-2">
          {experiences.map((e) => (
            <div key={e.id} className="card flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-slate-800">
                  {e.role} <span className="text-slate-400">@ {e.company}</span>
                </p>
                <p className="text-xs text-slate-400">
                  {e.startDate ? formatDate(e.startDate) : "?"} -{" "}
                  {e.current ? "Present" : e.endDate ? formatDate(e.endDate) : "?"}
                </p>
                {e.summary && <p className="mt-1 text-sm text-slate-500">{e.summary}</p>}
              </div>
              <form action={deleteWorkExperience}>
                <input type="hidden" name="id" value={e.id} />
                <SubmitIconButton
                  className="text-slate-300 hover:text-red-500"
                  icon={<Icon name="trash" className="h-4 w-4" />}
                />
              </form>
            </div>
          ))}
        </div>
      </section>

      {/* Learning */}
      <section>
        <h2 className="section-title mb-3">Learning log</h2>
        <details className="card mb-3">
          <summary className="cursor-pointer font-medium text-brand-700">+ Add learning entry</summary>
          <form action={createLearning} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="label">Title</label>
              <input name="title" className="input" required />
            </div>
            <div>
              <label className="label">Kind</label>
              <select name="kind" className="input" defaultValue="course">
                <option value="course">Course</option>
                <option value="book">Book</option>
                <option value="project">Project</option>
                <option value="article">Article</option>
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select name="status" className="input" defaultValue="in_progress">
                <option value="in_progress">In progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="label">Hours</label>
              <input name="hours" type="number" step="any" className="input" defaultValue={0} />
            </div>
            <div>
              <label className="label">Date</label>
              <input name="date" type="date" className="input" defaultValue={toDateInputValue(now)} />
            </div>
            <div>
              <label className="label">Related skill</label>
              <input name="skillName" className="input" />
            </div>
            <div className="sm:col-span-3">
              <SubmitButton className="btn-primary">Add</SubmitButton>
            </div>
          </form>
        </details>
        <div className="space-y-2">
          {learning.map((l) => (
            <div key={l.id} className="card flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-slate-800">
                  {l.title}
                  <span className="ml-2 badge bg-slate-100 capitalize text-slate-500">{l.kind}</span>
                </p>
                <p className="text-xs text-slate-400">
                  {formatDate(l.date)} · {l.hours}h · {l.status === "completed" ? "completed" : "in progress"}
                  {l.skillName && ` · ${l.skillName}`}
                </p>
              </div>
              <form action={deleteLearning}>
                <input type="hidden" name="id" value={l.id} />
                <SubmitIconButton
                  className="text-slate-300 hover:text-red-500"
                  icon={<Icon name="trash" className="h-4 w-4" />}
                />
              </form>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
