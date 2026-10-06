import type { HelpEntry } from "./types";

export const accountHelp = {
  settings: {
    title: "Settings",
    purpose:
      "Settings is where you manage your own account: your name and timezone, which modules you use, your weather location, your password and how the app looks.",
    steps: [
      "Check that your name and timezone are right, and save your profile.",
      "Under \"Modules\", switch off the parts of Control you do not use, then select \"Save modules\".",
      "Set a weather location if you use the Weather module.",
      "Choose a light, dark or system theme under \"Appearance\".",
    ],
    capabilities: [
      "Profile: change your display name and timezone. Your email address is shown but cannot be changed here.",
      "Modules: switch each module on or off, or all at once. A module that is off disappears from the menu, search, Home, Review and Reports.",
      "Weather location: search for a city or use your device's location, and choose metric or imperial units.",
      "Password: change your password by entering the current one and a new one of at least 8 characters.",
      "Appearance: follow your device, or always use the light or dark theme.",
    ],
    tips: [
      "Switching a module off never deletes its data. Switch it back on and everything is where you left it.",
      "Your timezone decides what counts as \"today\" on Home, in the calendar and in reminders.",
      "The theme is remembered per browser, so each device can have its own.",
      "The weather location section is only shown while the Weather module is on.",
    ],
  },

  admin: {
    title: "Admin",
    purpose:
      "Admin is only visible to the administrator. It is where you invite new people to Control and see who has an account.",
    steps: [
      "Open \"Invite a person\".",
      "Optionally enter the email address the invite is for, and adjust how many people may use it and how long it is valid.",
      "Select \"Create invite\".",
      "Use the copy button next to the new invite to copy its link.",
      "Send the link to the person yourself, for example by message or email.",
    ],
    capabilities: [
      "Create an invite link. By default it works for one person and is valid for 7 days (30 at most).",
      "Tie an invite to one email address, so the account can only be created with that address.",
      "See every invite with its status (Active, Used or Expired), how many times it was used, and who joined with it.",
      "Copy the link of any active invite again.",
      "Delete an invite. An unused link stops working immediately.",
      "See all users with name, email, the date they joined and their status.",
    ],
    tips: [
      "Control does not send email. The person only gets the invite if you send them the link.",
      "Anyone who has an active link can create an account with it, so share it privately.",
      "Every person gets a separate, empty account. You cannot see their data and they cannot see yours.",
      "Deleting an invite does not remove the account of someone who already joined with it.",
    ],
  },
} satisfies Record<string, HelpEntry>;
