export type NavItem = {
  href: string;
  label: string;
  icon: string;
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

export const navSections: NavSection[] = [
  {
    title: "Today",
    items: [
      { href: "/dashboard", label: "Home", icon: "home" },
      { href: "/dashboard/plan", label: "Plan", icon: "calendar" },
      { href: "/dashboard/todos", label: "Todos", icon: "check" },
      { href: "/dashboard/work", label: "Work", icon: "briefcase" },
      { href: "/dashboard/journal", label: "Journal", icon: "book" },
      { href: "/dashboard/inspirations", label: "Inspirations", icon: "sparkles" },
    ],
  },
  {
    title: "Track",
    items: [
      { href: "/dashboard/food", label: "Food", icon: "food" },
      { href: "/dashboard/budget", label: "Budget", icon: "wallet" },
      { href: "/dashboard/exercise", label: "Exercise", icon: "dumbbell" },
      { href: "/dashboard/religious", label: "Religious", icon: "moon" },
    ],
  },
  {
    title: "Grow",
    items: [
      { href: "/dashboard/goals", label: "Goals", icon: "target" },
      { href: "/dashboard/career", label: "Career", icon: "briefcase" },
      { href: "/dashboard/networking", label: "Networking", icon: "users" },
    ],
  },
  {
    title: "Reflect",
    items: [
      { href: "/dashboard/review", label: "Review", icon: "clipboard" },
      { href: "/dashboard/reports", label: "Reports", icon: "chart" },
    ],
  },
];

/** Flat list for backwards compatibility */
export const navItems: NavItem[] = navSections.flatMap((s) => s.items);
