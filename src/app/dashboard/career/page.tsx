import { prisma } from "@/lib/db";
import { requireModule } from "@/lib/session";
import { getDisabledModules } from "@/lib/queries/modules";
import { toDateInputValue, formatDate, formatRange, addDays } from "@/lib/date";
import type { ServerFormAction } from "@/components/ActionForm";
import PageHeader from "@/components/PageHeader";
import Icon from "@/components/Icon";
import ActionForm from "@/components/ActionForm";
import FormField from "@/components/FormField";
import EmptyState from "@/components/EmptyState";
import SubmitButton from "@/components/SubmitButton";
import SubmitIconButton from "@/components/SubmitIconButton";
import CollapsibleSection from "@/components/CollapsibleSection";
import CareerTabs, { parseCareerTab } from "@/components/CareerTabs";
import WorkExperienceForm from "./WorkExperienceForm";
import {
  createCareerGoal,
  setCareerGoalStatus,
  deleteCareerGoal,
  createSkill,
  updateSkillLevel,
  deleteSkill,
  createCertification,
  deleteCertification,
  deleteWorkExperience,
  createLearning,
  deleteLearning,
  createJobApplication,
  updateJobStage,
  deleteJobApplication,
} from "./actions";

export const metadata = { title: "Career" };

const LEARNING_LIMIT = 20;

const JOB_STAGES = [
  { value: "applied", label: "Applied", badge: "badge-brand" },
  { value: "interview", label: "Interview", badge: "badge-warning" },
  { value: "offer", label: "Offer", badge: "badge-success" },
  { value: "rejected", label: "Rejected", badge: "badge-danger" },
  { value: "withdrawn", label: "Withdrawn", badge: "badge-muted" },
] as const;

function stageInfo(stage: string) {
  return (
    JOB_STAGES.find((s) => s.value === stage) ?? {
      value: stage,
      label: stage.charAt(0).toUpperCase() + stage.slice(1),
      badge: "badge-muted",
    }
  );
}

const SKILL_LEVELS = [1, 2, 3, 4, 5];

function DeleteButton({
  action,
  id,
  name,
  noun,
  successMessage,
}: {
  action: ServerFormAction;
  id: string;
  name: string;
  noun: string;
  successMessage: string;
}) {
  return (
    <ActionForm
      action={action}
      confirm={{ title: `Delete ${noun} “${name}”?` }}
      successMessage={successMessage}
      className="shrink-0"
    >
      <input type="hidden" name="id" value={id} />
      <SubmitIconButton
        icon={<Icon name="trash" className="h-4 w-4" />}
        aria-label={`Delete ${noun} ${name}`}
        className="btn-icon-danger"
      />
    </ActionForm>
  );
}

function SectionHeader({ id, title, meta }: { id: string; title: string; meta?: React.ReactNode }) {
  return (
    <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
      <h2 id={id} className="section-title">
        {title}
      </h2>
      {meta && <p className="text-sm text-muted">{meta}</p>}
    </div>
  );
}

function StageOptions() {
  return (
    <>
      {JOB_STAGES.map((s) => (
        <option key={s.value} value={s.value}>
          {s.label}
        </option>
      ))}
    </>
  );
}

export default async function CareerPage({
  searchParams,
}: {
  searchParams: { tab?: string | string[] };
}) {
  const user = await requireModule("career");
  const userId = user.id;
  const now = new Date();
  const tab = parseCareerTab(searchParams.tab);

  const [goals, skills, certs, experiences, learningRows, learningCount, jobAppRows, contacts] = await Promise.all([
    prisma.careerGoal.findMany({ where: { userId, deletedAt: null }, orderBy: { createdAt: "desc" } }),
    prisma.skill.findMany({ where: { userId, deletedAt: null }, orderBy: { name: "asc" } }),
    prisma.certification.findMany({ where: { userId, deletedAt: null }, orderBy: { issuedAt: "desc" } }),
    prisma.workExperience.findMany({ where: { userId, deletedAt: null }, orderBy: { startDate: "desc" } }),
    prisma.learningEntry.findMany({
      where: { userId, deletedAt: null },
      orderBy: { date: "desc" },
      take: LEARNING_LIMIT,
      include: { skill: { select: { name: true, userId: true } } },
    }),
    prisma.learningEntry.count({ where: { userId, deletedAt: null } }),
    prisma.jobApplication.findMany({
      where: { userId, deletedAt: null },
      orderBy: { updatedAt: "desc" },
      include: { contact: { select: { name: true, userId: true } } },
    }),
    prisma.contact.findMany({
      where: { userId, deletedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const networkingOn = !(await getDisabledModules(userId)).includes("networking");

  // Never render a linked record that belongs to someone else.
  const learning = learningRows.map((l) => ({ ...l, skill: l.skill?.userId === userId ? l.skill : null }));
  const jobApps = jobAppRows.map((j) => ({ ...j, contact: j.contact?.userId === userId ? j.contact : null }));

  const certExpirySoon = addDays(now, 30);

  const goalsPanel = (
    <section aria-labelledby="career-goals-heading" className="space-y-3">
      <SectionHeader id="career-goals-heading" title="Career goals" meta={`${goals.length} total`} />
      <CollapsibleSection title="Add goal" variant="card">
        <ActionForm
          action={createCareerGoal}
          successMessage="Goal added"
          resetOnSuccess
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          <FormField label="Title" className="sm:col-span-2" required>
            {(_id, aria) => <input {...aria} name="title" className="input" required />}
          </FormField>
          <FormField label="Target date">
            {(_id, aria) => <input {...aria} name="targetDate" type="date" className="input" />}
          </FormField>
          <FormField label="Description" className="sm:col-span-2">
            {(_id, aria) => <textarea {...aria} name="description" className="input" rows={2} />}
          </FormField>
          <div className="sm:col-span-2">
            <SubmitButton className="btn-primary">Add goal</SubmitButton>
          </div>
        </ActionForm>
      </CollapsibleSection>
      {goals.length === 0 ? (
        <EmptyState
          variant="inline"
          headingLevel="h3"
          icon="target"
          title="No career goals yet"
          description="Add a goal above, like a promotion, a new role or a skill to master."
        />
      ) : (
        <ul className="space-y-2">
          {goals.map((g) => {
            const completed = g.status === "completed";
            return (
              <li key={g.id} className="card flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium text-slate-800 dark:text-slate-100">{g.title}</h3>
                    <span className={completed ? "badge-success" : "badge-brand"}>
                      {completed ? "Completed" : "Active"}
                    </span>
                  </div>
                  {g.description && <p className="mt-1 text-sm text-muted">{g.description}</p>}
                  {g.targetDate && <p className="mt-1 text-xs text-muted">Target: {formatDate(g.targetDate)}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <ActionForm action={setCareerGoalStatus}>
                    <input type="hidden" name="id" value={g.id} />
                    <input type="hidden" name="status" value={completed ? "active" : "completed"} />
                    <SubmitButton className="btn-ghost btn-sm">
                      {completed ? "Reopen" : "Mark complete"}
                    </SubmitButton>
                  </ActionForm>
                  <DeleteButton
                    action={deleteCareerGoal}
                    id={g.id}
                    name={g.title}
                    noun="goal"
                    successMessage="Goal deleted"
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );

  const skillsPanel = (
    <div className="space-y-10">
      <section aria-labelledby="career-skills-heading" className="space-y-3">
        <SectionHeader id="career-skills-heading" title="Skills" meta={`${skills.length} total`} />
        <CollapsibleSection title="Add skill" variant="card">
          <ActionForm
            action={createSkill}
            successMessage="Skill added"
            resetOnSuccess
            className="grid grid-cols-1 gap-4 sm:grid-cols-[2fr_1fr_2fr_auto] sm:items-end"
          >
            <FormField label="Skill" required>
              {(_id, aria) => <input {...aria} name="name" className="input" required />}
            </FormField>
            <FormField label="Level (1–5)">
              {(_id, aria) => (
                <select {...aria} name="level" className="input" defaultValue="3">
                  {SKILL_LEVELS.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              )}
            </FormField>
            <FormField label="Notes">
              {(_id, aria) => <input {...aria} name="notes" className="input" />}
            </FormField>
            <SubmitButton className="btn-primary">Add skill</SubmitButton>
          </ActionForm>
        </CollapsibleSection>
        {skills.length === 0 ? (
          <EmptyState
            variant="inline"
            headingLevel="h3"
            icon="sparkles"
            title="No skills yet"
            description="Add the skills you want to track and rate yourself from 1 to 5."
          />
        ) : (
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {skills.map((s) => (
              <li key={s.id} className="card flex flex-col gap-3 py-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-medium text-slate-800 dark:text-slate-100">{s.name}</h3>
                    <p className="mt-0.5 text-sm text-muted">Level {s.level} of 5</p>
                    <div className="mt-1.5 flex gap-1" aria-hidden="true">
                      {SKILL_LEVELS.map((n) => (
                        <span
                          key={n}
                          className={`h-2 w-6 rounded-full ${n <= s.level ? "bg-brand-500" : "bg-slate-200 dark:bg-slate-700"}`}
                        />
                      ))}
                    </div>
                  </div>
                  <DeleteButton
                    action={deleteSkill}
                    id={s.id}
                    name={s.name}
                    noun="skill"
                    successMessage="Skill deleted"
                  />
                </div>
                <ActionForm action={updateSkillLevel} className="flex items-end gap-2">
                  <input type="hidden" name="id" value={s.id} />
                  <FormField label={`Level for ${s.name}`} hideLabel className="w-28">
                    {(_id, aria) => (
                      <select {...aria} name="level" defaultValue={String(s.level)} className="input">
                        {SKILL_LEVELS.map((n) => (
                          <option key={n} value={n}>
                            Level {n}
                          </option>
                        ))}
                      </select>
                    )}
                  </FormField>
                  <SubmitButton className="btn-ghost btn-sm min-h-[38px] whitespace-nowrap">Set level</SubmitButton>
                </ActionForm>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="career-certs-heading" className="space-y-3">
        <SectionHeader id="career-certs-heading" title="Certifications" meta={`${certs.length} total`} />
        <CollapsibleSection title="Add certification" variant="card">
          <ActionForm
            action={createCertification}
            successMessage="Certification added"
            resetOnSuccess
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            <FormField label="Name" required>
              {(_id, aria) => <input {...aria} name="name" className="input" required />}
            </FormField>
            <FormField label="Issuer">
              {(_id, aria) => <input {...aria} name="issuer" className="input" />}
            </FormField>
            <FormField label="Issued">
              {(_id, aria) => <input {...aria} name="issuedAt" type="date" className="input" />}
            </FormField>
            <FormField label="Expires">
              {(_id, aria) => <input {...aria} name="expiresAt" type="date" className="input" />}
            </FormField>
            <FormField label="Credential ID" className="sm:col-span-2">
              {(_id, aria) => <input {...aria} name="credentialId" className="input" />}
            </FormField>
            <div className="sm:col-span-2">
              <SubmitButton className="btn-primary">Add certification</SubmitButton>
            </div>
          </ActionForm>
        </CollapsibleSection>
        {certs.length === 0 ? (
          <EmptyState
            variant="inline"
            headingLevel="h3"
            icon="shield"
            title="No certifications yet"
            description="Track certificates and when they expire, so renewals don't sneak up on you."
          />
        ) : (
          <ul className="space-y-2">
            {certs.map((c) => {
              const expiringSoon = c.expiresAt && c.expiresAt <= certExpirySoon && c.expiresAt >= now;
              const expired = c.expiresAt && c.expiresAt < now;
              return (
                <li key={c.id} className="card flex items-start justify-between gap-3 py-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-medium text-slate-800 dark:text-slate-100">{c.name}</h3>
                      {expired && <span className="badge-danger">Expired</span>}
                      {expiringSoon && !expired && <span className="badge-warning">Expiring soon</span>}
                    </div>
                    <p className="mt-0.5 text-xs text-muted">
                      {c.issuer ?? "—"}
                      {c.issuedAt && ` · issued ${formatDate(c.issuedAt)}`}
                      {c.expiresAt && ` · expires ${formatDate(c.expiresAt)}`}
                      {c.credentialId && ` · ID ${c.credentialId}`}
                    </p>
                  </div>
                  <DeleteButton
                    action={deleteCertification}
                    id={c.id}
                    name={c.name}
                    noun="certification"
                    successMessage="Certification deleted"
                  />
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );

  const workPanel = (
    <section aria-labelledby="career-work-heading" className="space-y-3">
      <SectionHeader id="career-work-heading" title="Work history" meta={`${experiences.length} total`} />
      <CollapsibleSection title="Add experience" variant="card">
        <WorkExperienceForm />
      </CollapsibleSection>
      {experiences.length === 0 ? (
        <EmptyState
          variant="inline"
          headingLevel="h3"
          icon="briefcase"
          title="No work history yet"
          description="Add your roles to keep a running CV."
        />
      ) : (
        <ul className="space-y-2">
          {experiences.map((e) => (
            <li key={e.id} className="card flex items-start justify-between gap-3 py-4">
              <div className="min-w-0">
                <h3 className="font-medium text-slate-800 dark:text-slate-100">
                  {e.role} <span className="font-normal text-muted">@ {e.company}</span>
                </h3>
                <p className="mt-0.5 text-xs text-muted">
                  {formatRange(e.startDate, e.current ? null : e.endDate, e.current ? "Present" : "—")}
                </p>
                {e.summary && <p className="mt-1 text-sm text-muted">{e.summary}</p>}
              </div>
              <DeleteButton
                action={deleteWorkExperience}
                id={e.id}
                name={`${e.role} @ ${e.company}`}
                noun="experience"
                successMessage="Experience deleted"
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );

  const learningPanel = (
    <section aria-labelledby="career-learning-heading" className="space-y-3">
      <SectionHeader
        id="career-learning-heading"
        title="Learning log"
        meta={
          learningCount > LEARNING_LIMIT
            ? `Showing latest ${LEARNING_LIMIT} of ${learningCount}`
            : `${learningCount} total`
        }
      />
      <CollapsibleSection title="Add learning entry" variant="card">
        <ActionForm
          action={createLearning}
          successMessage="Learning entry added"
          resetOnSuccess
          className="grid grid-cols-1 gap-4 sm:grid-cols-3"
        >
          <FormField label="Title" className="sm:col-span-2" required>
            {(_id, aria) => <input {...aria} name="title" className="input" required />}
          </FormField>
          <FormField label="Kind">
            {(_id, aria) => (
              <select {...aria} name="kind" className="input" defaultValue="course">
                <option value="course">Course</option>
                <option value="book">Book</option>
                <option value="project">Project</option>
                <option value="article">Article</option>
              </select>
            )}
          </FormField>
          <FormField label="Status">
            {(_id, aria) => (
              <select {...aria} name="status" className="input" defaultValue="in_progress">
                <option value="in_progress">In progress</option>
                <option value="completed">Completed</option>
              </select>
            )}
          </FormField>
          <FormField label="Hours">
            {(_id, aria) => (
              <input {...aria} name="hours" type="number" step="any" min={0} className="input" defaultValue={0} />
            )}
          </FormField>
          <FormField label="Date">
            {(_id, aria) => (
              <input {...aria} name="date" type="date" className="input" defaultValue={toDateInputValue(now)} />
            )}
          </FormField>
          <FormField label="Related skill">
            {(_id, aria) => (
              <select {...aria} name="skillId" className="input" defaultValue="">
                <option value="">— none —</option>
                {skills.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            )}
          </FormField>
          <div className="sm:col-span-3">
            <SubmitButton className="btn-primary">Add entry</SubmitButton>
          </div>
        </ActionForm>
      </CollapsibleSection>
      {learning.length === 0 ? (
        <EmptyState
          variant="inline"
          headingLevel="h3"
          icon="book"
          title="Nothing logged yet"
          description="Log courses, books and projects. Hours count towards linked learning goals."
        />
      ) : (
        <ul className="space-y-2">
          {learning.map((l) => (
            <li key={l.id} className="card flex items-start justify-between gap-3 py-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-medium text-slate-800 dark:text-slate-100">{l.title}</h3>
                  <span className="badge-muted capitalize">{l.kind}</span>
                  <span className={l.status === "completed" ? "badge-success" : "badge-brand"}>
                    {l.status === "completed" ? "Completed" : "In progress"}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted">
                  {formatDate(l.date)} · {l.hours}h
                  {(l.skill?.name || l.skillName) && ` · ${l.skill?.name ?? l.skillName}`}
                </p>
              </div>
              <DeleteButton
                action={deleteLearning}
                id={l.id}
                name={l.title}
                noun="learning entry"
                successMessage="Learning entry deleted"
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );

  const applicationsPanel = (
    <section aria-labelledby="career-apps-heading" className="space-y-3">
      <SectionHeader id="career-apps-heading" title="Job applications" meta={`${jobApps.length} total`} />
      <CollapsibleSection title="Add application" variant="card">
        <ActionForm
          action={createJobApplication}
          successMessage="Application added"
          resetOnSuccess
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          <FormField label="Company" required>
            {(_id, aria) => <input {...aria} name="company" className="input" required />}
          </FormField>
          <FormField label="Role" required>
            {(_id, aria) => <input {...aria} name="role" className="input" required />}
          </FormField>
          <FormField label="Stage">
            {(_id, aria) => (
              <select {...aria} name="stage" className="input" defaultValue="applied">
                <StageOptions />
              </select>
            )}
          </FormField>
          {networkingOn && (
            <FormField label="Linked contact">
              {(_id, aria) => (
                <select {...aria} name="contactId" className="input" defaultValue="">
                  <option value="">— none —</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </FormField>
          )}
          <FormField label="Follow-up date">
            {(_id, aria) => <input {...aria} name="dueDate" type="date" className="input" />}
          </FormField>
          <FormField label="Notes" className="sm:col-span-2">
            {(_id, aria) => <textarea {...aria} name="notes" className="input" rows={2} />}
          </FormField>
          <div className="sm:col-span-2">
            <SubmitButton className="btn-primary">Add application</SubmitButton>
          </div>
        </ActionForm>
      </CollapsibleSection>
      {jobApps.length === 0 ? (
        <EmptyState
          variant="inline"
          headingLevel="h3"
          icon="briefcase"
          title="No applications tracked"
          description="Add an application above to follow it from applied to offer."
        />
      ) : (
        <ul className="space-y-2">
          {jobApps.map((j) => {
            const stage = stageInfo(j.stage);
            return (
              <li
                key={j.id}
                className="card flex flex-col gap-3 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium text-slate-800 dark:text-slate-100">
                      {j.role} <span className="font-normal text-muted">@ {j.company}</span>
                    </h3>
                    <span className={stage.badge}>{stage.label}</span>
                  </div>
                  {(j.contact || j.dueDate) && (
                    <p className="mt-0.5 text-xs text-muted">
                      {[j.contact && `Contact: ${j.contact.name}`, j.dueDate && `Follow up ${formatDate(j.dueDate)}`]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  )}
                </div>
                <div className="flex items-end gap-2">
                  <ActionForm action={updateJobStage} className="flex items-end gap-2">
                    <input type="hidden" name="id" value={j.id} />
                    <FormField label={`Stage for ${j.role} @ ${j.company}`} hideLabel className="w-36">
                      {(_id, aria) => (
                        <select {...aria} name="stage" className="input" defaultValue={j.stage}>
                          <StageOptions />
                        </select>
                      )}
                    </FormField>
                    <SubmitButton className="btn-ghost btn-sm min-h-[38px] whitespace-nowrap">Update stage</SubmitButton>
                  </ActionForm>
                  <DeleteButton
                    action={deleteJobApplication}
                    id={j.id}
                    name={`${j.role} @ ${j.company}`}
                    noun="application"
                    successMessage="Application deleted"
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );

  const panels = {
    goals: goalsPanel,
    skills: skillsPanel,
    work: workPanel,
    learning: learningPanel,
    applications: applicationsPanel,
  } as const;

  return (
    <div>
      <PageHeader help={`career:${tab}`} title="Career" description="Track goals, skills, certifications, work history, and learning.">
        <CareerTabs active={tab} />
      </PageHeader>
      {panels[tab]}
    </div>
  );
}
