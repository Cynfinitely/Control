import TabNav from "@/components/TabNav";

export const NETWORKING_TABS = [
  { id: "log", label: "Log", href: "/dashboard/networking" },
  { id: "people", label: "People", href: "/dashboard/networking?tab=people" },
  { id: "insights", label: "Insights", href: "/dashboard/networking?tab=insights" },
] as const;

export type NetworkingTabId = (typeof NETWORKING_TABS)[number]["id"];

export function parseNetworkingTab(value: string | undefined): NetworkingTabId {
  if (value === "people" || value === "insights") return value;
  return "log";
}

export default function NetworkingTabs({ active }: { active: NetworkingTabId }) {
  return <TabNav aria-label="Networking sections" active={active} items={NETWORKING_TABS} className="mb-0" />;
}
