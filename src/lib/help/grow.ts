import type { HelpEntry } from "./types";

export const growHelp = {
  goals: {
    title: "Goals",
    purpose:
      "Goals is where you set what you want to get done in a week, a month or a year, and tick it off as you go. A goal is either a checkbox you complete once or a counter you add to until you reach a target. Counters can also count up by themselves from activity you log in other modules.",
    steps: [
      'Choose "Weekly", "Monthly" or "Yearly" at the top to pick the kind of period you want to plan.',
      'Open "Add goal", type a "Title" and choose a "Type": "Checkbox (done / not done)" or "Counter (+1 each time)".',
      'Fill in "Target" for a counter and, if you want it to count by itself, pick an option under "Auto-track from".',
      'Press "Add goal" to put the goal in the "Active" list for the period you are looking at.',
      'Tick the checkbox or press "+1" each time you make progress.',
      'Come back when a new period starts and use the carry-over button to bring unfinished goals forward.',
    ],
    capabilities: [
      'Switch between "Weekly", "Monthly" and "Yearly" goals with the tabs at the top. Each period has its own separate list.',
      'Step back to earlier weeks, months or years with the arrows next to the period name, and return with the "This week", "This month" or "This year" button. You cannot step forward past the current period.',
      'Add a goal to whichever period is on screen, including a past one. A counter with no "Target" gets a target of 1.',
      "Tick a checkbox goal to complete it, and tick it again to make it active again.",
      'Press "+1" on a counter to add one, or "+1 with a note" to add one together with a short "Check-in note" of up to 200 characters.',
      "Press the minus button on a counter to undo its most recent check-in. If that check-in was worth more than 1, for example several learning hours, the whole amount is taken off.",
      'A counter is marked "Done" and moves to "Completed" by itself when it reaches its target, and goes back to "Active" if you undo below the target.',
      'Link a counter under "Auto-track from": "Workouts logged" if you use the Exercise module, "Learning hours logged" if you use the Career module, or "Quran pages read" if you use the Religious module. Linked goals show an "Auto" badge and count up when you log that activity.',
      'Open "Add milestones" on any goal to break it into smaller steps, then tick each one off or delete it. The heading changes to "Milestones" with a done count once you have some.',
      'Open "Recent check-ins" on a counter to see its last five additions with their dates and notes.',
      'Carry unfinished goals forward into the current period. On the current period the button reads like "Carry 3 over", and on the previous period like "Carry 3 incomplete to this week", with the number of goals that will be copied.',
      'Delete a goal with the bin button. A message with "Undo" appears straight afterwards so you can bring it back.',
    ],
    tips: [
      "Carrying over makes a copy in the current period and leaves the original where it was. Counters keep the count they had reached, milestones are not copied, and a goal is skipped if the current period already has one with the same title.",
      "Only goals from the period just before the current one can be carried over. The button disappears when there is nothing left to carry.",
      "Auto-tracking adds 1 per workout, the number of hours per learning entry (1 if the hours are 0) and the number of pages per Quran reading. It goes to the weekly, monthly and yearly goals that cover the date of the activity, and only while the goal is still active.",
      'Deleting a workout, learning entry or reading later does not take the count back off. Use the minus button for that. The "Weekly goals" card on Home shows how many of this week\'s goals are completed.',
    ],
    related: [{ label: "Settings (switch modules on or off)", href: "/dashboard/settings" }],
  },

  "career:goals": {
    title: "Career: Goals",
    purpose:
      "This tab holds your longer-term career goals, such as a promotion, a new role or a skill to master. Each goal can have a description and a target date, and is either active or completed.",
    steps: [
      'Open "Add goal" and type a "Title".',
      'Add a "Target date" and a "Description" if you want them.',
      'Press "Add goal" to save it to the list.',
      'Press "Mark complete" on the goal when you have reached it.',
    ],
    capabilities: [
      'Add a career goal with a "Title", an optional "Target date" and an optional "Description".',
      'See all your career goals with the newest first, each with an "Active" or "Completed" badge, its description and its target date.',
      'Press "Mark complete" to complete a goal.',
      'Press "Reopen" on a completed goal to make it active again.',
      "Delete a goal with the bin button. You are asked to confirm first.",
      'See how many career goals you have in total next to the "Career goals" heading.',
    ],
    tips: [
      "A goal cannot be edited after it is added. To change the title, date or description, delete it and add it again.",
      "The target date is shown for reference only. Nothing happens automatically when it passes.",
      'These goals are separate from the Goals page: they have no period, no counter and no auto-tracking. The "Career" card on Home shows how many of them are active.',
    ],
    related: [
      { label: "Career: Skills & Certs", href: "/dashboard/career?tab=skills" },
      { label: "Career: Learning", href: "/dashboard/career?tab=learning" },
    ],
  },

  "career:skills": {
    title: "Career: Skills & Certs",
    purpose:
      "This tab has two lists: the skills you want to track, each rated from 1 to 5, and your certifications with their issue and expiry dates. Use it to keep an honest picture of where you stand and to see renewals coming.",
    steps: [
      'Open "Add skill", type the "Skill" name, pick a "Level (1–5)" and press "Add skill".',
      'Change a rating later by picking a new level on the skill\'s card and pressing "Set level".',
      'Open "Add certification", fill in the "Name" and any of "Issuer", "Issued", "Expires" and "Credential ID", then press "Add certification".',
      'Check the certification list for "Expiring soon" and "Expired" badges.',
    ],
    capabilities: [
      'Add a skill with a "Skill" name, a "Level (1–5)" that starts at 3, and optional "Notes".',
      "See your skills in alphabetical order, each with its level out of 5 shown as a row of bars.",
      'Change a skill\'s level with the level list on its card and the "Set level" button.',
      "Delete a skill with the bin button after confirming.",
      'Add a certification with a "Name" and optional "Issuer", "Issued" date, "Expires" date and "Credential ID".',
      "See your certifications with the most recently issued first, each showing its issuer, dates and credential ID.",
      'A certification shows an "Expiring soon" badge when it expires within the next 30 days, and an "Expired" badge once the expiry date has passed.',
      "Delete a certification with the bin button after confirming.",
      "Skills you add here become choices for \"Related skill\" on the Learning tab.",
    ],
    tips: [
      "Only a skill's level can be changed after it is added. To change a skill's name or anything on a certification, delete it and add it again.",
      'The "Notes" you type when adding a skill are saved but are not shown on the skill\'s card.',
      "A level has to be saved with \"Set level\". Choosing a new level in the list without pressing the button changes nothing.",
      'The "Career" card on Home mentions certifications that are about to expire.',
    ],
    related: [
      { label: "Career: Learning", href: "/dashboard/career?tab=learning" },
      { label: "Career: Goals", href: "/dashboard/career" },
    ],
  },

  "career:work": {
    title: "Career: Work History",
    purpose:
      "This tab is a running record of the jobs you have held, like a simple CV. Each entry has a company, a role, dates and a short summary.",
    steps: [
      'Open "Add experience" and fill in "Company" and "Role".',
      'Set the "Start" date, then either set an "End" date or tick "Current role".',
      'Write a short "Summary" of what you did, if you want one.',
      'Press "Add experience" to save the entry.',
    ],
    capabilities: [
      'Add a work experience with "Company", "Role", optional "Start" and "End" dates and an optional "Summary".',
      'Tick "Current role" for the job you hold now. The "End" date is switched off and the entry shows "Present" as its end.',
      "See your work history with the most recent start date first, each entry showing the role, the company, the date range and the summary.",
      "Delete an entry with the bin button after confirming.",
      'See how many entries you have in total next to the "Work history" heading.',
    ],
    tips: [
      "An entry cannot be edited after it is added. When a current role ends, delete the entry and add it again with an end date.",
      'More than one entry can be ticked as "Current role". The app does not untick the old one for you.',
    ],
    related: [
      { label: "Career: Applications", href: "/dashboard/career?tab=applications" },
      { label: "Career: Skills & Certs", href: "/dashboard/career?tab=skills" },
    ],
  },

  "career:learning": {
    title: "Career: Learning",
    purpose:
      "This tab is a log of what you study: courses, books, projects and articles, with the hours you put in. The hours also count towards any goal you have linked to learning, if you use the Goals module.",
    steps: [
      'Open "Add learning entry" and type a "Title".',
      'Choose a "Kind" ("Course", "Book", "Project" or "Article") and a "Status" ("In progress" or "Completed").',
      'Enter the "Hours" you spent and check the "Date", which starts as today.',
      'Pick a "Related skill" if the entry belongs to one of your skills.',
      'Press "Add entry" to save it.',
    ],
    capabilities: [
      'Add a learning entry with "Title", "Kind", "Status", "Hours", "Date" and an optional "Related skill".',
      'Choose the "Related skill" from the skills you added on the "Skills & Certs" tab.',
      "Log a session on a past day by changing the \"Date\".",
      "See your entries with the most recent date first, each showing its kind, its status, the date, the hours and the related skill.",
      'The list shows your latest 20 entries. When you have more, the heading says "Showing latest 20" together with the total.',
      "Delete an entry with the bin button after confirming.",
      'If you use the Goals module, every entry you add counts up goals set to "Learning hours logged" by the number of hours.',
    ],
    tips: [
      "Each entry is one session. To log more hours on the same course, add another entry, because an entry and its status cannot be edited afterwards.",
      "An entry with 0 hours still adds 1 to a linked goal.",
      "Linked goals are counted for the week, month and year of the entry's date, and only while the goal is still active. Deleting the entry later does not take the hours back off the goal.",
      'The "Career" card on Home shows your learning hours for this week.',
    ],
    related: [
      { label: "Career: Skills & Certs", href: "/dashboard/career?tab=skills" },
      { label: "Career: Goals", href: "/dashboard/career" },
    ],
  },

  "career:applications": {
    title: "Career: Applications",
    purpose:
      "This tab tracks the jobs you apply for, from the first application through interview to an offer, a rejection or a withdrawal. Each application can carry a follow-up date and, if you use the Networking module, a linked person.",
    steps: [
      'Open "Add application" and fill in "Company" and "Role".',
      'Leave "Stage" on "Applied", or choose the stage the application is already at.',
      'Add a "Follow-up date" and "Notes" if you want them.',
      'Press "Add application" to save it.',
      'Pick a new stage on the application and press "Update stage" whenever it moves on.',
    ],
    capabilities: [
      'Add an application with "Company", "Role", "Stage", an optional "Follow-up date" and optional "Notes".',
      'Choose from five stages: "Applied", "Interview", "Offer", "Rejected" and "Withdrawn". Each one has its own coloured badge in the list.',
      'If you use the Networking module, pick a "Linked contact" from your people to record who you know at the company.',
      'Move an application to another stage with the stage list on its row and the "Update stage" button.',
      "See your applications with the most recently changed first, each showing the role, the company, the stage, the linked contact and the follow-up date.",
      "Delete an application with the bin button after confirming.",
      'See how many applications you have in total next to the "Job applications" heading.',
    ],
    tips: [
      "Only the stage can be changed after an application is added. The follow-up date, linked contact and notes are fixed.",
      'The "Notes" you type are saved but are not shown in the list.',
      "The follow-up date is shown for reference only. It does not create a reminder.",
      "Updating a stage moves that application to the top of the list.",
    ],
    related: [
      { label: "Career: Work History", href: "/dashboard/career?tab=work" },
      { label: "Settings (switch modules on or off)", href: "/dashboard/settings" },
    ],
  },

  "networking:log": {
    title: "Networking: Log",
    purpose:
      "This tab is the quick way to record that you were in touch with someone: who, how and when, with topics and a note if you want the detail. Every log updates that person's last contact date, which decides whether they count as overdue.",
    steps: [
      'Start typing in "Person" and pick someone from the list, or type a new name to add them.',
      'Choose a "Type": "Call", "Meeting", "Message" or "Event".',
      'Set "When" with "Today", "Yesterday" or the date box.',
      'Add "Topics" and a "Note" if you want to remember what you talked about.',
      'Press "Log" to save it.',
    ],
    capabilities: [
      'Find a person by typing part of their name in "Person". The list shows up to eight matches with their relationship.',
      'Add a new person while logging: type a name that is not in your list, choose a "Relationship" ("Family", "Friend", "Professional" or "Other"), and the button then reads like "Add Sam & log".',
      'Choose the type of contact. "Call" is selected to start with.',
      'Set the date with the "Today" and "Yesterday" buttons or pick any date in the date box.',
      'Add topics by typing and pressing Enter or comma. Remove a topic with its x, or press Backspace in an empty topic box to remove the last one.',
      "Tap a suggested topic below the box to add it. Suggestions come from topics you used on earlier logs.",
      'Write a free-text "Note" about the conversation.',
      'See your latest 40 logs under "Recent", each with its type, the person, the note, the topics and the date.',
      'Click a name under "Recent" to open that person\'s page.',
      'Delete a log with its bin button after confirming.',
    ],
    tips: [
      "Deleting a log is permanent. There is no undo.",
      "A log cannot be edited. If something is wrong, delete it and log it again.",
      "If the name you type exactly matches someone already in your list, the log goes to that person and no second person is created.",
      "After you log, the form clears and goes back to \"Call\" and \"Today\", so check the date each time you log several past contacts in a row.",
    ],
    related: [
      { label: "Networking: People", href: "/dashboard/networking?tab=people" },
      { label: "Networking: Insights", href: "/dashboard/networking?tab=insights" },
    ],
  },

  "networking:people": {
    title: "Networking: People",
    purpose:
      "This tab lists everyone you want to stay in touch with and shows when you last spoke to each of them. People you have been silent with for too long are marked and sorted to the top.",
    steps: [
      'Open "Add person", type a "Name", choose a "Relationship" and press "Add person".',
      'Press "Log interaction" in the message that appears if you want to record a contact with them straight away.',
      'Use "Search people" or the relationship buttons to find someone in a long list.',
      "Click a person to open their page, where you can add contact details and see their full timeline.",
    ],
    capabilities: [
      'Add a person with a "Name" and a "Relationship": "Family", "Friend", "Professional" or "Other".',
      'Jump straight to logging with the new person already filled in by pressing "Log interaction" in the confirmation message.',
      'Search the list by name, organisation, role or tag with "Search people".',
      'Filter by relationship with the buttons above the list. "All people" removes the filter, and only relationships you actually use get a button.',
      'See for each person when you last had contact, or "Never". If the last contact was not a call, its type is shown next to it.',
      "See a person's role and organisation under their name. For family and friends the relationship is shown instead.",
      'People who are overdue get a yellow badge: "no contact" if you have never logged anything with them, or the number of days followed by "d+ silent".',
      "The list is sorted with overdue people first, then by most recent contact.",
      "Click any row to open that person's page.",
    ],
    tips: [
      'A person is overdue when you have no log with them at all, or when the last log is older than their "Touch every (days)" number. That number is 30 unless you change it on the person\'s page.',
      "Only the name and relationship can be set here. Organisation, role, email, phone, tags and notes are added on the person's page.",
      "The search and the relationship filter work together, so a search only looks inside the relationship you have selected.",
      'The "Networking" card on Home shows how many people are overdue.',
    ],
    related: [
      { label: "Networking: Log", href: "/dashboard/networking" },
      { label: "Networking: Insights", href: "/dashboard/networking?tab=insights" },
    ],
  },

  "networking:insights": {
    title: "Networking: Insights",
    purpose:
      "This tab summarises your contact with people over a period: how often you were in touch, with whom, in what way and about what. It also lists everyone who is overdue for contact right now.",
    steps: [
      'Choose a period at the top right: "This week", "This month" or "90 days".',
      'Read the three totals: "Touches", "Calls" and "People reached".',
      'Check "Overdue" to see who you should get back in touch with, and click a name to open their page.',
      'Use the three filters under "Activity" to look at the logs of one type, one person or one topic.',
    ],
    capabilities: [
      'Switch the period between "This week" (Monday to Sunday), "This month" (the calendar month) and "90 days" (the last 90 days including today). The exact dates are shown at the top left, and "This month" is selected to start with.',
      'See "Touches" (all logs in the period), "Calls" (logs of type "Call") and "People reached" (how many different people you logged).',
      'See a "Frequency" chart with one bar per week showing how many logs you made.',
      'See "Type mix": how many logs were calls, meetings, messages and events.',
      'See "By relationship": how many logs were with family, friends, professional contacts and others.',
      'See "Overdue": every person who is past their contact interval, with when you last had contact or "no contact". Names link to the person\'s page.',
      'See "Topics": up to 12 of the topics you logged most in the period, with how often each came up and with whom.',
      'See "Activity": every log in the period, newest first, with the person, type, note, topics and date.',
      'Narrow "Activity" with "All types", "All people" and "All topics". The filters can be combined.',
    ],
    tips: [
      '"Overdue" always shows who is overdue today. It does not change when you change the period.',
      "Logs cannot be deleted from this tab. Delete them on the \"Log\" tab or on the person's page.",
      'The "Activity" filters only change that list. The totals and charts above always cover the whole period.',
      '"Topics" stays empty until you add topics when you log.',
    ],
    related: [
      { label: "Networking: Log", href: "/dashboard/networking" },
      { label: "Networking: People", href: "/dashboard/networking?tab=people" },
    ],
  },

  "networking:person": {
    title: "Networking: Person",
    purpose:
      "This page is everything about one person: when you were last in touch, a form to log a new contact with them, their full timeline, and their details. It is also where you set how often you want to be in touch with them.",
    steps: [
      'Check "Last contact" at the top to see how long it has been.',
      'Log a new contact with the form: choose a "Type" and "When", add "Topics" or a "Note", and press "Log".',
      'Open "Edit person" to add their organisation, role, email, phone, tags and notes.',
      'Set "Touch every (days)" to how often you want to be in touch, then press "Save changes".',
      'Read the "Timeline" to remind yourself what you talked about last time.',
    ],
    capabilities: [
      'See "Last contact" as a date and how long ago it was, or "Never". If the last contact was not a call, the date of your last call is shown as well.',
      'See a yellow badge when the person is overdue: "no contact" if nothing is logged, or the number of days followed by "d+ silent".',
      'Press "Call" or "Email" at the top to start a phone call or an email. Each button only appears once you have saved a phone number or an email address.',
      "Log a contact with this person using the same form as the \"Log\" tab, without having to pick the person.",
      'See every log with this person under "Timeline", newest first, with type, note, topics and date.',
      "Delete a log from the timeline with its bin button after confirming.",
      'Open "Edit person" to change "Name", "Relationship", "Organization", "Role", "Email", "Phone", "Tags" and "Notes", then press "Save changes".',
      'Set "Touch every (days)" to choose after how many days without contact this person counts as overdue. Leave it empty to use 30 days.',
      'Remove the person with "Delete person" at the bottom of "Edit person". You are asked to confirm, and then taken back to the "People" tab.',
      'Go back with the "Networking" and "People" links above the name.',
    ],
    tips: [
      '"Touch every (days)" drives the overdue badge here and on the "People" tab, the "Overdue" list on "Insights" and the overdue count on Home.',
      "Any type of log counts as contact and clears the overdue badge, not only calls.",
      "Deleting a person hides them and their logs from the timeline and from insights, and there is no way to bring them back in the app. Deleting a single log is permanent too.",
      'What you type in "Tags", "Organization" and "Role" can be found with "Search people" on the "People" tab. For family and friends, role and organisation are not shown under the name.',
    ],
    related: [
      { label: "Networking: People", href: "/dashboard/networking?tab=people" },
      { label: "Networking: Log", href: "/dashboard/networking" },
      { label: "Networking: Insights", href: "/dashboard/networking?tab=insights" },
    ],
  },
} satisfies Record<string, HelpEntry>;
