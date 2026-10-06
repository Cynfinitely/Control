import type { HelpEntry } from "./types";

export const todayHelp = {
  home: {
    title: "Home",
    purpose:
      "Home is your daily overview. It gathers the most important things from the modules you have switched on, so you can see how today is going and jump straight to whatever needs attention.",
    steps: [
      "Read the cards from top to bottom: priorities, today's todos, today's plan, then the numbers under \"Today at a glance\".",
      "Tick off or add todos directly in the todos card without leaving the page.",
      "Select any stat card to open that module and act on it.",
      "Use \"Quick actions\" at the bottom to start the things you log most often.",
    ],
    capabilities: [
      "Shows a greeting and today's date in your own timezone.",
      "Lists today's todos with a quick-add field, and tells you how many are overdue.",
      "Previews today's plan and highlights the block that is happening now.",
      "Shows the weather for your saved location.",
      "Shows a status card per module (goals, food, budget, workouts, prayers, career, networking) marked \"On track\", \"Needs attention\" or \"Off track\". Each card links to its module.",
      "Shows your life priorities, one inspiration from your library, and a reminder to re-read your principles with a \"Mark reviewed\" button.",
      "Reminds you to do the weekly review when it is still open for the week.",
      "Shows a short setup checklist during your first week. You can dismiss it.",
      "\"All modules\" opens search, where you can jump to any page or action.",
    ],
    tips: [
      "Home only shows modules that are switched on. If a card is missing, turn its module on in Settings under \"Modules\".",
      "Press Cmd+K on a Mac or Ctrl+K on Windows from anywhere to open search.",
      "Every page has a \"?\" beside its title that opens a guide like this one. The ? key does the same.",
    ],
    related: [{ label: "Settings", href: "/dashboard/settings" }],
  },

  plan: {
    title: "Plan",
    purpose:
      "Plan is a time-blocked schedule for one day. You decide in advance what happens when, then mark each block as done or skipped as the day goes on.",
    steps: [
      "Pick the day with the day navigator at the top.",
      "Add blocks with a title, start time, end time and kind in the add form.",
      "Or start faster: accept \"Smart suggestions\", apply a template, copy the previous day, or paste a list under \"Import from text\".",
      "During the day, mark each block done or skipped on the timeline.",
      "When a day's layout works well, save it as a template so you can reuse it.",
    ],
    capabilities: [
      "Add, edit and delete blocks. A block has a title, start and end time, a kind (custom, todo, meal, prayer, workout, follow-up or break) and optional notes.",
      "Mark a block done or skipped. Marking a block that is linked to a todo or a follow-up as done also completes that item.",
      "Overlap protection: a new block cannot overlap an existing one, and the page shows \"Overlaps detected\" if older blocks clash.",
      "\"Smart suggestions\" proposes blocks from your open todos, planned meals, daily prayers and a workout, depending on which modules you use. Add a suggestion or dismiss it.",
      "Copy all blocks from the previous day as a starting point.",
      "Templates: save the current day as a named template, optionally as the default for a weekday, then apply it to any day (adding to the day or replacing it) or delete it.",
      "\"Import from text\": paste lines such as \"09:00 Deep work\", check the preview, then merge with the day or replace it.",
      "On today's plan a line shows the current time and late blocks are flagged.",
      "An empty day that has a default template for its weekday offers \"Apply template\" straight away.",
    ],
    tips: [
      "A block can be at most 12 hours long and must end after it starts.",
      "When you merge imported text, lines that clash with existing blocks are skipped and reported.",
      "The plan is separate from the Calendar module: calendar events do not appear as blocks.",
    ],
  },

  calendar: {
    title: "Calendar",
    purpose:
      "Calendar holds events and reminders: things that happen at a set date and time, including ones that repeat. It is separate from the daily Plan, which is for how you spend the hours of one day.",
    steps: [
      "Choose a view: Month, Week, Day or Agenda (the next 60 days).",
      "Select \"New event\" and enter a title, start and end. Turn on all-day if it has no time.",
      "Set \"Repeats\" if it happens regularly, and pick when you want to be reminded.",
      "Use \"Reminder\" for something you only need a nudge about, without an event.",
      "Select an event or reminder later to edit or delete it.",
    ],
    capabilities: [
      "Four views with their own previous and next controls: Month, Week, Day and Agenda.",
      "Create events with a title, description, location, start, end and an all-day option.",
      "Repeating events: daily, weekly on chosen weekdays, monthly or yearly.",
      "Event reminders: at the start time, or 15 minutes, 1 hour or 1 day before. You can choose more than one.",
      "Standalone reminders with their own date and time.",
      "Editing or deleting a repeating event asks whether you mean this occurrence, this and following ones, or the entire series.",
      "Due reminders arrive as notifications under the bell icon in the menu.",
    ],
    tips: [
      "Times are shown in the timezone set in your profile. Change it in Settings if they look wrong.",
      "If you switch the Calendar module off, no new reminder notifications are created until you switch it on again.",
    ],
    related: [{ label: "Settings", href: "/dashboard/settings" }],
  },

  todos: {
    title: "Todos",
    purpose:
      "Todos is a checklist for one day, plus a backlog for everything that does not have a day yet. It keeps today's list short and realistic.",
    steps: [
      "Pick the day with the day navigator.",
      "Add a todo with a title, and optionally a priority, category and due date.",
      "Choose under \"Add to\" whether it belongs to this day or to the Backlog.",
      "Tick todos off as you finish them.",
      "Open the Backlog section to pull items into the day you are viewing.",
    ],
    capabilities: [
      "Add todos with a title, priority, category and due date.",
      "Check a todo off, and uncheck it again if you were too quick.",
      "Move a todo to the backlog, or pull a backlog item into the day you are viewing.",
      "Delete a todo. A short \"Undo\" appears in case it was a mistake.",
      "\"Move past todos to backlog\" appears when open todos are left on earlier days and moves them all in one go.",
      "Today's todos also appear on Home, where you can add and tick them off.",
    ],
    tips: [
      "A todo with a due date in the past counts as overdue on Home and in Reports.",
      "If you use the Plan module, open todos for a day are suggested as time blocks there.",
    ],
  },

  work: {
    title: "Work",
    purpose:
      "Work is for your working day: a short list of the outcomes you commit to today, and a log of what actually happened.",
    steps: [
      "Pick the day with the day navigator.",
      "Add the few things that would make today a good work day as focus items.",
      "Mark each one done or skipped as the day goes on.",
      "Write what really happened in the work log at the end of the day and save it.",
    ],
    capabilities: [
      "Add up to 8 focus items per day.",
      "Mark a focus item done, skip it, reopen it or remove it. Removing offers \"Undo\".",
      "Link a focus item to one of your career goals or skills, if you use the Career module.",
      "Keep one free-text work log per day. The page warns you before you leave with unsaved text.",
      "See how many of today's focus items are done at a glance.",
    ],
    tips: [
      "The limit of 8 is deliberate: the list is for outcomes, not for every small task. Use Todos for those.",
    ],
  },

  journal: {
    title: "Journal",
    purpose:
      "Journal is one short entry per day: how you felt, what went well, what got in the way, and anything else worth remembering.",
    steps: [
      "Pick the day with the day navigator.",
      "Choose your mood from 1 to 5.",
      "Fill in \"Wins\", \"Blockers\" and \"Notes\". All of them are optional.",
      "Save. You can come back and change the entry later.",
    ],
    capabilities: [
      "One entry per day with a mood score and three text fields.",
      "Saving again on the same day updates that day's entry instead of creating a second one.",
      "Move between days to read or complete earlier entries.",
    ],
    tips: ["A couple of lines is enough. The value comes from doing it most days, not from writing a lot."],
  },

  weather: {
    title: "Weather",
    purpose:
      "Weather shows current conditions and the forecast for one location that you choose. It is there to help you plan your day and week.",
    steps: [
      "Set your location first: open Settings and search for your city, or use your device's location.",
      "Come back here to see the conditions right now.",
      "Use \"Daily\" to pick a day and see it hour by hour, or \"Weekly\" for the days ahead.",
    ],
    capabilities: [
      "Current conditions: temperature, feels like, humidity, wind, sunrise and sunset.",
      "\"Daily\" view: choose a day and see the hourly forecast with precipitation.",
      "\"Weekly\" view: the forecast for the coming days.",
      "\"Change location\" takes you to Settings, where you can also switch between metric and imperial units.",
      "A compact weather card appears on Home.",
    ],
    tips: [
      "Until a location is set, the page only shows a prompt to add one.",
      "If the forecast service cannot be reached you will see \"Forecast unavailable\". Try again a little later.",
    ],
    related: [{ label: "Settings", href: "/dashboard/settings" }],
  },
} satisfies Record<string, HelpEntry>;
