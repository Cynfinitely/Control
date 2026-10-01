import TabNav from "@/components/TabNav";

export const CAREER_TABS = [
  { id: "goals", label: "Goals" },
  { id: "skills", label: "Skills & Certs" },
  { id: "work", label: "Work History" },
  { id: "learning", label: "Learning" },
  { id: "applications", label: "Applications" },
] as const;

export type CareerTabId = (typeof CAREER_TABS)[number]["id"];

export function parseCareerTab(value: string | string[] | undefined): CareerTabId {
  const v = Array.isArray(value) ? value[0] : value;
  return CAREER_TABS.find((t) => t.id === v)?.id ?? "goals";
}

export function careerTabHref(tab: CareerTabId) {
  return tab === "goals" ? "/dashboard/career" : `/dashboard/career?tab=${tab}`;
}

/**
 * Career section navigation. The active tab lives in `?tab=` so it survives
 * server-action revalidation and can be linked; links expose aria-current.
 */
export default function CareerTabs({ active }: { active: CareerTabId }) {
  return (
    <TabNav
      aria-label="Career sections"
      active={active}
      className="mb-0"
      items={CAREER_TABS.map((t) => ({ id: t.id, label: t.label, href: careerTabHref(t.id) }))}
    />
  );
}
