import { MODULE_SECTIONS, MODULES, moduleFilter, type ModuleId } from "@/lib/modules";

export type NavItem = {
  href: string;
  label: string;
  icon: string;
  /** The switchable module this item belongs to; absent for always-on pages. */
  module?: ModuleId;
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

const HOME: NavItem = { href: "/dashboard", label: "Home", icon: "home" };

export const navSections: NavSection[] = MODULE_SECTIONS.map((title) => ({
  title,
  items: [
    ...(title === "Today" ? [HOME] : []),
    ...MODULES.filter((m) => m.section === title).map((m) => ({
      href: m.href,
      label: m.label,
      icon: m.icon,
      module: m.id,
    })),
  ],
}));

/** Nav sections without the modules the user switched off; empty sections are dropped. */
export function visibleNavSections(disabled: readonly ModuleId[]): NavSection[] {
  const modules = moduleFilter(disabled);
  return navSections
    .map((section) => ({ ...section, items: modules.keep(section.items) }))
    .filter((section) => section.items.length > 0);
}
