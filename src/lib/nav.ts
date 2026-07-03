export type NavItem = {
  href: string;
  label: string;
  icon: string;
};

export const navItems: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: "home" },
  { href: "/dashboard/todos", label: "Todos", icon: "check" },
  { href: "/dashboard/goals", label: "Goals", icon: "target" },
  { href: "/dashboard/food", label: "Food", icon: "food" },
  { href: "/dashboard/budget", label: "Budget", icon: "wallet" },
  { href: "/dashboard/exercise", label: "Exercise", icon: "dumbbell" },
  { href: "/dashboard/religious", label: "Religious", icon: "moon" },
  { href: "/dashboard/career", label: "Career", icon: "briefcase" },
  { href: "/dashboard/networking", label: "Networking", icon: "users" },
  { href: "/dashboard/journal", label: "Journal", icon: "book" },
  { href: "/dashboard/review", label: "Review", icon: "chart" },
  { href: "/dashboard/reports", label: "Reports", icon: "chart" },
];
