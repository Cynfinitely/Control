import type { HelpEntry } from "./types";

const BUDGET_PAGES = {
  overview: { label: "Overview", href: "/dashboard/budget" },
  uncategorized: { label: "Uncategorized", href: "/dashboard/budget?view=uncategorized" },
  categories: { label: "Categories", href: "/dashboard/budget/categories" },
};

export const budgetHelp = {
  "budget:overview": {
    title: "Budget: Overview",
    purpose:
      "Budget shows where your money goes. You import your bank transactions from Nordea, give them categories, and the page turns them into monthly income, spending and savings figures.",
    steps: [
      "In Nordea Netbank, download your account transactions as a CSV or TXT file.",
      "Open \"Import Nordea CSV\" here and upload the file.",
      "Read the import summary, then open the \"Uncategorized\" tab to categorize what is left.",
      "Come back to this tab and use the month navigator to review each month.",
      "Scroll to the transactions list to check, edit or delete individual rows.",
    ],
    capabilities: [
      "Import Nordea statements in CSV or TXT format. Transactions you already imported are skipped, so uploading overlapping files is safe.",
      "Merchants you have categorized before are categorized automatically on every later import.",
      "Monthly cards for Income, Expenses, Net and Savings rate, with a comparison to the previous month.",
      "\"Spending by category\" bars, \"Top merchants\" and a savings rate trend across months.",
      "A transactions list with a Week, Month or Custom range, a filter for income or expenses, and a category filter.",
      "Edit or delete any transaction.",
      "\"AI prompt…\" prepares a text summary of the month that you can copy into an AI assistant.",
      "\"Imports & data\" lists every import with \"Undo import\", which removes just the rows from that file.",
      "\"Reset all budget data\" deletes all budget transactions, imports and remembered merchant rules after you type RESET. Your categories are kept.",
    ],
    tips: [
      "Only Nordea export files are supported for import.",
      "\"Reset all budget data\" cannot be undone. Use \"Undo import\" if you only want to remove one file.",
      "Your bank file is read once to create the transactions. The file itself is not stored.",
    ],
    related: [BUDGET_PAGES.uncategorized, BUDGET_PAGES.categories],
  },

  "budget:uncategorized": {
    title: "Budget: Uncategorized",
    purpose:
      "This tab is the to-do list for your budget: every transaction that has no category yet. Clearing it makes the monthly figures and category charts accurate.",
    steps: [
      "Choose whether to see this month only or all months.",
      "Select one or more transactions from the same merchant.",
      "Pick a category and apply it.",
      "Repeat until the list is empty. The number on the tab shows how many are left.",
    ],
    capabilities: [
      "Switch between uncategorized transactions for the selected month and for all months.",
      "Select several rows and categorize them in one action.",
      "Categorizing one transaction also categorizes the other uncategorized transactions from the same merchant.",
      "The choice is remembered as a rule, so future imports from that merchant are categorized automatically.",
    ],
    tips: [
      "Work through the biggest merchants first. One choice often clears many rows.",
      "If the category you need does not exist, add it on the Categories tab first.",
      "To change a category later, edit the transaction in the list on the Overview tab.",
    ],
    related: [BUDGET_PAGES.categories, BUDGET_PAGES.overview],
  },

  "budget:categories": {
    title: "Budget: Categories",
    purpose:
      "Categories are the labels your transactions are sorted into. You start with a preset list for expenses and income, and can shape it to fit how you think about your money.",
    steps: [
      "Look through the Expense and Income lists.",
      "Add any category you are missing.",
      "Rename categories so the names make sense to you.",
      "Move them up or down into the order you want, and hide the ones you never use.",
    ],
    capabilities: [
      "Separate lists for expense categories and income categories.",
      "Add your own categories. They are marked \"Custom\"; the starting ones are marked \"Preset\".",
      "Rename any category.",
      "Move a category up or down to change its position in lists and pickers.",
      "Hide a category, and show it again later.",
    ],
    tips: [
      "A hidden category disappears from the pickers but transactions already in it keep their category.",
      "Categories are yours alone. Other users have their own separate list.",
    ],
    related: [BUDGET_PAGES.overview, BUDGET_PAGES.uncategorized],
  },
} satisfies Record<string, HelpEntry>;
