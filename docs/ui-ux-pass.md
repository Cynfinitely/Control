# UI/UX conventions

How Control's UI is put together. Follow these when adding or changing screens so the app stays consistent.

## Tokens (`src/app/globals.css`)

| Need | Use | Don't |
|---|---|---|
| Primary / secondary / destructive button | `btn-primary`, `btn-ghost`, `btn-danger` (outline), `btn-danger-solid` (confirm dialogs) | raw `bg-brand-600 …`, `btn-ghost text-red-600` |
| Small button | add `btn-sm` (`btn-ghost btn-sm`) | `text-xs py-1 px-2` overrides |
| Icon-only button | `<IconButton icon="trash" aria-label="Delete X" tone="danger" />` or `btn-icon` / `btn-icon-danger` (44px hit area) | `text-slate-300` icons, `h-3 w-3` buttons |
| Inline text action | `link` | `text-xs text-brand-600` |
| Text field | `input` (+ a real `<label>`) | placeholder-only fields |
| Field label / hint / error | `label`, `hint`, `field-error` | `text-slate-400` hints |
| Surface | `card`; list with edge-to-edge rows: `card-flush` + `divide-y`; quiet inset: `tile` | raw `rounded-xl border bg-white`, cards inside cards |
| Status pill | `badge-muted`, `badge-brand`, `badge-success`, `badge-warning`, `badge-danger` | raw `bg-green-100 text-green-700` pills, `emerald-*` |
| Chip / filter pill | `chip chip-idle` / `chip chip-active` (or `SegmentedControl`) | ad-hoc `rounded-full px-3 py-1 text-xs` |
| Section heading (h2) | `section-title` | one-off `text-lg font-semibold …` |
| Sub-heading (h3) | `subsection-title` | `<p className="font-semibold">` |
| Small uppercase label | `eyebrow` | `text-xs uppercase text-slate-400` |
| Secondary text | `text-muted` (or `text-slate-500 dark:text-slate-400`) | `text-slate-400` / `text-slate-300` on meaningful text (fails contrast) |

Focus rings are global (`:focus-visible` in `@layer base`); don't remove outlines.

## Components (`src/components/`)

- **`PageHeader`**: one per page (renders the page's only `h1`). Props: `title`, `description`, `action` (buttons/links, right-aligned), `breadcrumb` (above the title), `children` (below the title, e.g. `<TabNav>`).
- **`TabNav`**: links between sub-pages or URL tabs, using `aria-current="page"`. `items=[{id?, href, label, count?}]`, `active`, `aria-label`, `variant="underline" | "pills"`.
- **`SegmentedControl`**: "pick one of N" within a page. Buttons (`onChange`, `aria-pressed`) or links (`href` per option). Use it for view switchers, period pickers and type pickers.
- **`StepNavigator` / `DayNavigator` / `WeekNavigator` / `MonthNavigator`**: ‹ label › steppers with labelled arrows and Today/This week/This month shortcuts. `WeekNavigator` reads and writes `?week=YYYY-MM-DD` (Monday). Don't wrap them in an extra sticky box.
- **`DateRangePicker`**: labelled From/To with validation.
- **`StatCard`**: `label`, `value`, `hint`, `href`, `icon`, `tone` (`good|warn|bad`) **with** `status` text, `progress` (0–100), `size="sm"`, `surface="tile"` (use inside another card).
- **`EmptyState`**: `variant="card"` for a page-level empty state, `variant="inline"` inside a card or list. `headingLevel` defaults to `h2`; use `h3` inside a section that has its own h2.
- **`CollapsibleSection`**: disclosure. `variant="card"` with `title="Add goal"` replaces `<details className="card"><summary>+ Add …`. `as="h2"` puts the title in the outline. Never put buttons or links inside the summary.
- **`FocusTarget`**: wrap an add form so `?focus=add` (or `?focus=log`) deep links open any collapsed `<details>` inside and focus the first field. Pass `value="add"` to react to one value only.
- **`FormField`**: `<FormField label="Name" hint="…" error={…}>{(id, aria) => <input id={id} {...aria} className="input" />}</FormField>`. Works in server and client components.
- **`ActionForm`**: the default way to submit a server action from any page.
  ```tsx
  <ActionForm action={deleteThing} confirm={{ title: "Delete “X”?", message: "This can't be undone." }} successMessage="Deleted">
    <input type="hidden" name="id" value={x.id} />
    <SubmitIconButton icon={<Icon name="trash" className="h-4 w-4" />} aria-label={`Delete ${x.name}`} className="btn-icon-danger" />
  </ActionForm>
  ```
  - The action may return `ActionResult` (`success(msg)` / `failure(msg)` from `@/lib/action-result`) or nothing. On success it toasts the returned message, falling back to `successMessage`; on failure it toasts the error.
  - `resetOnSuccess` clears the form, and `onSuccess` lets you follow up (e.g. a toast with an action).
  - `redirect()` inside the action still works.
- **`FormAction`**: same thing for `(prev, formData)` actions built with `wrapFormAction`.
- **`SubmitButton`** / **`SubmitIconButton`**: show a pending spinner automatically inside `ActionForm`/`FormAction`. `SubmitIconButton` requires `aria-label`.
- **`IconButton`**: a non-submit icon button (`aria-label` required).
- **`CheckButton`**: the only checkbox-style toggle for tasks, goals, milestones and shopping items: `checked`, `onChange`, `label` (accessible name). It has a 44px hit area and a 24px visible box. Use `type="submit"` inside a form.
- **`DeleteConfirmButton`**: client-side confirm and callback. `appearance="text"` gives a labelled small danger button.
- **`ConfirmDialog`** / **`Modal`**: native `<dialog>` with a focus trap, Escape, focus restore and scroll lock. Danger confirms focus **Cancel** first.
- **`AiPromptDialog`**: "AI prompt…" button plus a copy dialog.
- **`PageLoadingSkeleton`**: variants `default | list | form | calendar | todos | religious | career | planner | plan | goals`. Every route gets a `loading.tsx`.

## Interaction rules

1. **Every mutation gives feedback**: toast on success (short, past tense: "Saved", "Workout deleted") and on failure (what went wrong and what to do). Server actions return `failure("…")` for validation errors instead of a bare `return;`.
2. **Every destructive action asks first** through `ActionForm confirm` or `DeleteConfirmButton`, unless the action has a real Undo (Todos, Goals). There it's Undo only, with no double confirm. Confirm copy names the thing: `Delete “Morning run”?`.
3. **Every field has a label**: visible (`label`) or `sr-only`. Chip groups use `<fieldset><legend className="label">`.
4. **State is never color-only**: pair color with text, an icon, `aria-pressed`, `aria-current` or `aria-checked`.
5. **Touch targets are ≥ 40–44px** on anything tappable.
6. **Empty means one clear message and one next step**, not empty tables or controls that do nothing.
7. **Dates**: `formatDate`, `formatDateTime`, `formatRange` (en-GB, en dash) from `@/lib/date`. Missing values render "—".
8. **Metadata**: every `page.tsx` exports `export const metadata = { title: "Budget" }` (the root layout appends " · Control").
