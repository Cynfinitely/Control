"use client";

import { formatDate } from "@/lib/date";
import { juzForPage, khatmPercent, QURAN_TOTAL_PAGES, readingRange } from "@/lib/quran";
import ActionForm from "@/components/ActionForm";
import CollapsibleSection from "@/components/CollapsibleSection";
import SubmitButton from "@/components/SubmitButton";
import { logQuran, setQuranPosition } from "./actions";

type Session = {
  id: string;
  date: Date | string;
  pagesRead: number;
  fromPage: number | null;
  toPage: number | null;
  note: string | null;
};

type Props = {
  currentPage: number;
  khatmsCompleted: number;
  sessions: Session[];
  dayValue: string;
};

const QUICK_AMOUNTS = [1, 5, 10] as const;

export default function QuranKhatmCard({
  currentPage,
  khatmsCompleted,
  sessions,
  dayValue,
}: Props) {
  const juz = juzForPage(currentPage);
  const pct = khatmPercent(currentPage);
  const khatmNumber = khatmsCompleted + 1;

  return (
    <section className="card mb-6" aria-labelledby="quran-title">
      <div className="flex items-center gap-2">
        <h2 id="quran-title" className="section-title">
          Quran khatm
        </h2>
        <span className="badge-brand">Logs to today</span>
      </div>
      <p className="mt-1 text-sm text-muted">
        Next page to read in the 604-page mushaf. Logging pages moves the bookmark and counts toward
        a Quran daily reading if you have one.
      </p>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted">Next page</p>
          <p className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {currentPage}
            <span className="text-lg font-semibold text-muted"> / {QURAN_TOTAL_PAGES}</span>
          </p>
          <p className="mt-1 text-sm text-muted">
            Juz {juz} of 30 · Khatm {khatmNumber}
            {khatmsCompleted > 0 ? ` · ${khatmsCompleted} completed` : ""}
          </p>
        </div>
        <p className="text-sm font-medium text-brand-700 dark:text-brand-300">{pct}% of this khatm</p>
      </div>

      <div
        className="mt-3 h-2 w-full overflow-hidden rounded-full progress-track"
        role="progressbar"
        aria-label="Khatm progress"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="h-full bg-brand-500" style={{ width: `${pct}%` }} />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
        {QUICK_AMOUNTS.map((amount) => (
          <ActionForm key={amount} action={logQuran} className="sm:flex-none">
            <input type="hidden" name="pagesRead" value={amount} />
            <input type="hidden" name="date" value={dayValue} />
            <SubmitButton className="btn-primary touch-target w-full sm:w-auto" aria-label={`Log ${amount} ${amount === 1 ? "page" : "pages"} read today`}>
              +{amount} {amount === 1 ? "page" : "pages"}
            </SubmitButton>
          </ActionForm>
        ))}
      </div>
      <ActionForm
        action={logQuran}
        resetOnSuccess
        className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[6rem_minmax(0,1fr)_auto] sm:items-end"
      >
        <input type="hidden" name="date" value={dayValue} />
        <div>
          <label className="label" htmlFor="quran-custom-pages">
            Pages
          </label>
          <input
            id="quran-custom-pages"
            name="pagesRead"
            type="number"
            min={1}
            defaultValue={1}
            inputMode="numeric"
            className="input"
          />
        </div>
        <div className="min-w-0">
          <label className="label" htmlFor="quran-note">
            Note <span className="font-normal text-muted">(optional)</span>
          </label>
          <input id="quran-note" name="note" className="input" />
        </div>
        <SubmitButton className="btn-ghost touch-target">Log pages</SubmitButton>
      </ActionForm>

      <CollapsibleSection title="Set current page" className="mt-4">
        <ActionForm action={setQuranPosition} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="quran-current-page">
              Next page (1–{QURAN_TOTAL_PAGES})
            </label>
            <input
              id="quran-current-page"
              name="currentPage"
              type="number"
              min={1}
              max={QURAN_TOTAL_PAGES}
              defaultValue={currentPage}
              className="input"
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="quran-khatms">
              Khatms completed
            </label>
            <input
              id="quran-khatms"
              name="khatmsCompleted"
              type="number"
              min={0}
              defaultValue={khatmsCompleted}
              className="input"
            />
          </div>
          <div className="flex items-end">
            <SubmitButton className="btn-ghost touch-target w-full">Save position</SubmitButton>
          </div>
        </ActionForm>
      </CollapsibleSection>

      {sessions.length > 0 && (
        <div className="mt-4 space-y-1 border-t border-slate-100 pt-3 dark:border-slate-700">
          <h3 className="subsection-title">Recent sessions</h3>
          {sessions.map((session) => (
            <div key={session.id} className="flex items-start justify-between gap-3 text-sm text-muted">
              <span className="min-w-0">
                {formatDate(session.date)}
                {session.fromPage != null && session.toPage != null && (
                  <span className="ml-2">
                    {readingRange(session.fromPage, session.toPage)}
                  </span>
                )}
                {session.note ? <span className="ml-2 italic">{session.note}</span> : null}
              </span>
              <span className="shrink-0 font-medium text-slate-700 dark:text-slate-200">
                {session.pagesRead} {session.pagesRead === 1 ? "page" : "pages"}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
