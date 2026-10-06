import type { HelpEntry } from "./types";

const FOOD_PAGES = {
  diary: { label: "Diary", href: "/dashboard/food" },
  week: { label: "Week summary", href: "/dashboard/food/week" },
  trends: { label: "Trends", href: "/dashboard/food/report" },
  meals: { label: "Default Meals", href: "/dashboard/food/meals" },
  planner: { label: "Planner", href: "/dashboard/food/planner" },
  settings: { label: "Food settings", href: "/dashboard/food/settings" },
};

export const foodHelp = {
  "food:diary": {
    title: "Food: Diary",
    purpose:
      "The diary is where you log what you eat and drink on a given day. It is built to be quick: type a name, or log a meal you eat often with one tap.",
    steps: [
      "Pick the day with the day navigator.",
      "Type what you ate, set the time and meal label, and log it.",
      "Open the optional section if you also want to record contents, how hungry you were, a note or nutrition.",
      "Use the water counter each time you drink a glass.",
      "Next time, log repeat meals with one tap from \"Default Meals\" or \"Recent\".",
    ],
    capabilities: [
      "Log food by name with a time and a meal label.",
      "Optionally record what the meal contained, your hunger before eating, a note, and calories, protein, carbs and fat.",
      "One-tap logging from your Default Meals and from foods you logged recently.",
      "Count glasses of water for the day, and remove one if you tapped too often.",
      "See the day as a timeline and edit or delete any entry.",
      "\"Meals you repeat\" spots meals you log often and offers \"Make default\" to turn one into a Default Meal.",
      "\"This week so far\" shows short observations about the week with a link to the week summary.",
    ],
    tips: [
      "What you see depends on the mode chosen in Food settings. In \"Observe\" mode there are no numbers or targets, and the \"Make default\" suggestions are hidden.",
      "You can rename the meal labels (for example Breakfast, Lunch, Dinner) in Food settings.",
    ],
    related: [FOOD_PAGES.meals, FOOD_PAGES.week, FOOD_PAGES.settings],
  },

  "food:week": {
    title: "Food: Week summary",
    purpose:
      "The week summary turns one week of diary entries into patterns: how regularly you logged, what you eat most, and when you eat.",
    steps: [
      "Use the week navigator to choose a week. Future weeks are not available.",
      "Read the four numbers at the top for a quick picture of the week.",
      "Scroll down for observations, your most frequent meals and foods, and timing.",
      "Open \"Nutrition\" at the bottom if you track calories and macros.",
    ],
    capabilities: [
      "Counts for the week: days logged, meals logged, snack days and how often you used a Default Meal.",
      "Plain-language observations about the week.",
      "Your most frequent meals and most frequent foods.",
      "Timing: when your first meal usually is, and how often you snack after 20:00.",
      "Default Meal usage for the week.",
      "A collapsible section with average nutrition per day.",
    ],
    tips: [
      "The summary is only as good as the diary. A few days of logging are needed before patterns appear.",
      "For longer periods or a comparison against targets, use Trends.",
    ],
    related: [FOOD_PAGES.diary, FOOD_PAGES.trends],
  },

  "food:trends": {
    title: "Food: Trends",
    purpose:
      "Trends shows totals and averages over any period you choose, compared with your nutrition targets. It also prepares a ready-made prompt if you want to discuss your eating with an AI assistant.",
    steps: [
      "Choose a range: last 7 or 14 days, this or last week, this or last month, or custom dates.",
      "Read the averages at the top and how they compare with your targets.",
      "Check the daily totals table to see which days were over or under.",
      "Select \"AI prompt…\" and then \"Copy prompt\" if you want to paste your data into an AI assistant.",
    ],
    capabilities: [
      "Range presets plus custom dates, with previous and next buttons to step through periods.",
      "Average calories, protein, carbs and fat per day for the range.",
      "A table of daily totals with a \"Vs target\" status for each day.",
      "Every entry in the range, grouped by day.",
      "A copy-ready prompt that summarizes the range for an AI assistant.",
    ],
    tips: [
      "Targets are set in Food settings under \"Advanced: nutrition targets\".",
      "The AI prompt is only text for you to copy. Nothing is sent anywhere until you paste it somewhere yourself.",
    ],
    related: [FOOD_PAGES.week, FOOD_PAGES.settings],
  },

  "food:meals": {
    title: "Food: Default Meals",
    purpose:
      "Default Meals are the meals you eat again and again. Save one here once and you can log it to the diary or add it to the planner with a single tap.",
    steps: [
      "Give the meal a name, for example \"Chicken wraps\".",
      "Optionally choose which meal of the day it usually is.",
      "List the ingredients separated by commas. They are used for the shopping list.",
      "Add nutrition values if you track them, then save.",
    ],
    capabilities: [
      "Create a Default Meal with a name, optional meal label, ingredients and optional nutrition.",
      "Edit or remove an existing Default Meal.",
      "\"Meals you repeat\" suggests diary entries that you could promote to a Default Meal.",
      "Default Meals appear as one-tap buttons in the diary and as choices in the planner.",
    ],
    tips: [
      "Ingredients you enter here are added to the shopping list automatically when you plan the meal.",
      "Removing a Default Meal does not delete diary entries that were logged from it.",
    ],
    related: [FOOD_PAGES.diary, FOOD_PAGES.planner],
  },

  "food:planner": {
    title: "Food: Planner",
    purpose:
      "The planner lays out what you intend to eat in a week and builds a shopping list from it. When you eat a planned meal, you can log it to the diary in one tap.",
    steps: [
      "Pick the week with the week navigator.",
      "Open \"Add meal\" under a day and choose a Default Meal, or type a name.",
      "Add ingredients to a planned meal if it is not a Default Meal.",
      "Open \"Shopping list\" and tick items off as you buy them.",
      "On the day, select \"Log to diary\" on a planned meal when you eat it.",
    ],
    capabilities: [
      "Plan meals for each day of a week, from a Default Meal or by typing a name and meal label.",
      "Add ingredients, with an optional quantity, to any planned meal.",
      "\"Log to diary\" copies a planned meal into that day's diary. \"Log again\" logs it another time.",
      "Remove a planned meal.",
      "\"Shopping list\" gathers the ingredients of every planned meal in the week, with checkboxes.",
    ],
    tips: [
      "The page is wider than the others so that all seven days fit. On a phone the days are stacked.",
      "If you use the weekly Review module, it reminds you how many shopping items are still open.",
    ],
    related: [FOOD_PAGES.meals, FOOD_PAGES.diary],
  },

  "food:settings": {
    title: "Food: Settings",
    purpose:
      "Food settings decide how much detail the Food module asks of you. Start simple and add numbers only when you want them.",
    steps: [
      "Choose a mode: \"Observe\", \"Stabilize\" or \"Optimize\".",
      "Edit the meal labels, one per line, or pick one of the presets.",
      "Save your preferences.",
      "If you chose \"Optimize\", open \"Advanced: nutrition targets\" and set your daily targets.",
    ],
    capabilities: [
      "\"Observe\": log what you eat with as little effort as possible. No targets and no numbers.",
      "\"Stabilize\": the app points out meals you repeat so you can turn them into Default Meals.",
      "\"Optimize\": calories and macros are shown and compared with your targets.",
      "Rename the meal labels used across the diary, planner and Default Meals.",
      "Set daily targets for calories, protein, carbs and fat.",
    ],
    tips: [
      "Targets only show up in the diary and reports while the mode is \"Optimize\".",
      "Changing the mode never deletes anything. It only changes what is shown.",
    ],
    related: [FOOD_PAGES.diary, FOOD_PAGES.trends],
  },
} satisfies Record<string, HelpEntry>;
