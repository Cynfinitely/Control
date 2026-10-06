import type { HelpEntry } from "./types";

export const reflectHelp = {
  review: {
    title: "Weekly review",
    purpose:
      "The weekly review is a short guided routine for closing one week and preparing the next. It walks you through the modules you use, shows the relevant numbers, and lets you tick each step off.",
    steps: [
      "Open the review once a week. Home reminds you when it is still open.",
      "Go through the steps in order. Each one shows live data and links to the page where you can act.",
      "Tick a step when you are done with it.",
      "Write anything worth remembering under \"Notes\".",
      "Select \"Complete review\" to close the week.",
    ],
    capabilities: [
      "Up to six steps: clear todos and backlog, check weekly goals, spiritual catch-up, review spending, relationships, and plan the week ahead.",
      "Summary cards at the top that jump to the matching step.",
      "The todos step can move all unfinished todos from earlier days to the backlog in one action.",
      "The goals step lists this week's goals, and you can update them without leaving the page.",
      "The relationships step lists people you have not contacted within the interval you set for them.",
      "A progress bar and step count for the current week.",
      "Free-text notes saved with the week.",
      "Complete the review, or reopen it if you want to change something.",
    ],
    tips: [
      "Steps and cards that belong to a module you have switched off are left out, so the review only covers what you actually use.",
      "The review always covers the current week, Monday to Sunday.",
      "You can complete the review without ticking every step.",
    ],
    related: [{ label: "Settings", href: "/dashboard/settings" }],
  },

  reports: {
    title: "Reports",
    purpose:
      "Reports gives you the numbers for a day, a week or a month across the modules you use. It is read-only: a place to look back, not to enter anything.",
    steps: [
      "Choose \"Daily\", \"Weekly\" or \"Monthly\" at the top.",
      "Check the date range shown under the title.",
      "Read the sections, one per module.",
      "Select a figure to open the page it comes from.",
    ],
    capabilities: [
      "Three periods: today, this week and this month.",
      "Productivity: todos completed and created, backlog size and overdue todos.",
      "Goals: active this week and completed in the period.",
      "Food: days and meals logged, snack days, Default Meal uses, water and nutrition averages.",
      "Fitness: workouts, gym sessions, walks, cardio minutes, sets and weight change.",
      "Religious: prayers on time and missed, on-time rate, qaza, dhikr, Quran pages and fasting days.",
      "Career and Networking: learning entries and hours, goals completed, skills added, interactions and calls.",
      "Budget: income, expenses, net, savings rate, top spending category and number of transactions.",
    ],
    tips: [
      "A section only appears when its module is switched on.",
      "Reports always cover the current day, week or month. To look at an earlier period in detail, use the module's own page.",
    ],
    related: [{ label: "Settings", href: "/dashboard/settings" }],
  },
} satisfies Record<string, HelpEntry>;
