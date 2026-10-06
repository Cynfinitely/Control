import type { HelpEntry } from "./types";

export const valuesHelp = {
  principles: {
    title: "Principles",
    purpose:
      "Principles is the list of personal rules and guardrails you want to live by, grouped by category so you can read them in one go. You can mark once a day that you have read them, and change the list whenever your rules change.",
    steps: [
      'Read the list in "Read" view, which is what opens first.',
      'Press "Mark reviewed" when you have read them for today.',
      'Switch to "Manage" to add your own principles or change the ones that are there.',
      'Type the "Text", choose a "Category" and press "Add principle".',
      'Switch back to "Read" to see the finished list.',
    ],
    capabilities: [
      'Read all your principles as one numbered list in "Read" view, with a heading for each category.',
      'Search with "Search principles…". It matches the text of a principle or the name of its category, and works in both views.',
      'Press "Mark reviewed" to record that you read your principles today. The button is replaced by a "Reviewed today" badge until tomorrow.',
      'Switch between "Read" and "Manage" with the buttons at the top right.',
      'Add a principle in "Manage" with a "Text" and a "Category": "Environment", "Urge protocol", "Tracking", "Sleep & food", "Structure & movement", "Self-talk & recovery" or "Support & faith".',
      'Open "Edit" under a principle in "Manage" to change its text or move it to another category, then press "Save changes".',
      'Press "Archive" on a principle to remove it from your list. You are asked to confirm.',
      'See how many principles you have next to "Your principles" in "Manage".',
      "A starter list of default principles is created for you the first time you open this page.",
    ],
    tips: [
      "The starter list is only created once, and it is written in Turkish. If you archive every principle it does not come back.",
      "An archived principle cannot be restored in the app. Add it again if you want it back.",
      "Principles cannot be reordered. The categories always appear in the same fixed order, and a new principle goes to the end of its category.",
      'Home has a Principles card with the same "Mark reviewed" button. Marking it in either place counts for the day, and it cannot be unmarked.',
    ],
    related: [],
  },

  inspirations: {
    title: "Inspirations",
    purpose:
      "Inspirations is your own library of quotes, wise words and personal notes to come back to when you need motivation. One of them is picked at random and shown on Home every time you visit.",
    steps: [
      'Type a quote or a note under "Text" in "Add an inspiration".',
      'Fill in "Author (optional)" if you want to remember who said it.',
      'Press "Add inspiration" to save it to "Your library".',
      "Open Home to see one of your inspirations picked at random.",
    ],
    capabilities: [
      'Add an inspiration with a "Text" and an optional author.',
      'See everything you saved under "Your library", newest first, with the total next to the heading.',
      'Edit an inspiration with its pencil button: change the text or the author and press "Save changes", or press "Cancel" to leave it as it was.',
      "Delete an inspiration with its bin button. You are asked to confirm first.",
      "Home shows one inspiration chosen at random each time the page loads.",
      'On Home, press "Another" to see a different one, or "Manage" to come to this page.',
    ],
    tips: [
      "Deleting an inspiration is permanent. There is no undo.",
      'The "Another" button on Home only appears when you have saved at least two inspirations, and it never shows the same one twice in a row.',
      "The choice on Home is random, so the same inspiration can come up on several visits and others may take a while to appear.",
    ],
    related: [],
  },

  priorities: {
    title: "Priorities",
    purpose:
      "Priorities is the ranked order of what matters most in your life, such as religion, health or family. It is not a to-do list: it is the short list you measure everything else against, and it is shown at the top of Home.",
    steps: [
      'Type what comes first under "Title" in "Add a priority".',
      'Add a "Note (optional)" on why it matters to you.',
      'Press "Add priority" and repeat for the others.',
      "Use the up and down arrows to put them in the order you really live by.",
      'Open Home to see the list on the "Life priorities" card.',
    ],
    capabilities: [
      'Add a priority with a "Title" and an optional note. A new priority goes to the bottom of the ranking.',
      "See your priorities as a numbered list, with number 1 the most important.",
      "Move a priority one place up or down with the arrow buttons on its row.",
      'Open "Edit" under a priority to change its title or note, then press "Save changes".',
      "Remove a priority with its bin button. You are asked to confirm first.",
      'Home shows the full ranked list with notes on the "Life priorities" card, with a "Manage" button that brings you here.',
    ],
    tips: [
      "You can have at most 12 priorities. When you reach 12, the add form is replaced by a message and you have to remove one before adding another.",
      "Removing a priority is permanent. There is no undo.",
      "Each press of an arrow moves a priority one place, so moving it several places takes several presses.",
    ],
    related: [],
  },
} satisfies Record<string, HelpEntry>;
