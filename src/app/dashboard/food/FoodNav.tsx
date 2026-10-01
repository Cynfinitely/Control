import TabNav from "@/components/TabNav";

const LINKS = [
  { href: "/dashboard/food", label: "Diary" },
  { href: "/dashboard/food/week", label: "Week summary" },
  { href: "/dashboard/food/report", label: "Trends" },
  { href: "/dashboard/food/meals", label: "Default Meals" },
  { href: "/dashboard/food/planner", label: "Planner" },
  { href: "/dashboard/food/settings", label: "Settings" },
] as const;

export type FoodNavHref = (typeof LINKS)[number]["href"];

/** Food section navigation. Render it as PageHeader children. */
export default function FoodNav({ active }: { active: FoodNavHref }) {
  return <TabNav items={LINKS} active={active} aria-label="Food sections" className="mb-0" />;
}
