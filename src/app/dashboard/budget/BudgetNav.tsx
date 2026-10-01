import TabNav from "@/components/TabNav";

export type BudgetTab = "overview" | "uncategorized" | "categories";

type Props = {
  active: BudgetTab;
  uncategorizedCount: number;
  /** Month the user is looking at ("YYYY-MM"); carried between Overview and Uncategorized. */
  monthParam?: string;
};

/** Budget section navigation. Render it as PageHeader children. */
export default function BudgetNav({ active, uncategorizedCount, monthParam }: Props) {
  const month = monthParam ? `month=${monthParam}` : "";
  const items = [
    { id: "overview", href: month ? `/dashboard/budget?${month}` : "/dashboard/budget", label: "Overview" },
    {
      id: "uncategorized",
      href: `/dashboard/budget?view=uncategorized${month ? `&${month}` : ""}`,
      label: "Uncategorized",
      count: uncategorizedCount,
    },
    { id: "categories", href: "/dashboard/budget/categories", label: "Categories" },
  ];
  return <TabNav items={items} active={active} aria-label="Budget sections" className="mb-0" />;
}
