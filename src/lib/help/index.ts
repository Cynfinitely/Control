import type { HelpEntry } from "./types";
import { todayHelp } from "./today";
import { foodHelp } from "./food";
import { budgetHelp } from "./budget";
import { bodyHelp } from "./body";
import { growHelp } from "./grow";
import { valuesHelp } from "./values";
import { reflectHelp } from "./reflect";
import { accountHelp } from "./account";

/**
 * Every page guide, keyed by page and, for pages with tabs, by tab
 * ("budget:uncategorized"). PageHeader requires one of these keys, so adding
 * a page means adding its guide here.
 */
export const HELP = {
  ...todayHelp,
  ...foodHelp,
  ...budgetHelp,
  ...bodyHelp,
  ...growHelp,
  ...valuesHelp,
  ...reflectHelp,
  ...accountHelp,
} satisfies Record<string, HelpEntry>;

export type HelpKey = keyof typeof HELP;
export type { HelpEntry };
