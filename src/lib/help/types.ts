/**
 * One page guide, shown in the slide-over panel opened by the "?" button next
 * to a page title. Text is plain strings so it can be tested and searched.
 */
export type HelpEntry = {
  /** Panel heading: the page name, with the tab after a colon when the page has tabs. */
  title: string;
  /** What the page is for, in two or three sentences. */
  purpose: string;
  /** How to use the page, as ordered steps for a first-time user. */
  steps: string[];
  /** Everything the page can do, one capability per item. */
  capabilities: string[];
  /** Things that are easy to miss. */
  tips?: string[];
  /** Other pages worth opening next. Same module or Settings only, so a link never leads to a module that is switched off. */
  related?: { label: string; href: string }[];
};
