"use client";

import { formatDate } from "@/lib/date";
import { juzForPage, khatmPercent, QURAN_TOTAL_PAGES, readingRange } from "@/lib/quran";
import SubmitButton from "@/components/SubmitButton";
import { logQuran, setQuranPosition } from "./actions";

type Session = {
  id: string;
  date: Date;
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
    <div className="card mb-6">
      <h2 className="section-title">Quran khatm</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Next page to read in the 604-page mushaf. Logging pages moves the bookmark and counts toward
        a Quran daily reading if you have one.
      </p>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Currently at</p>
          <p className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {currentPage}
            <span className="text-lg font-semibold text-slate-400"> / {QURAN_TOTAL_PAGES}</span>
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Juz {juz} of 30 · Khatm {khatmNumber}
            {khatmsCompleted > 0 ? ` · ${khatmsCompleted} completed` : ""}
          </p>
        </div>
        <p className="text-sm font-medium text-brand-700 dark:text-brand-300">{pct}% of this khatm</p>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full progress-track">
        <div className="h-full bg-brand-500" style={{ width: `${pct}%` }} />
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {QUICK_AMOUNTS.map((amount) => (
          <form key={amount} action={logQuran} className="sm:flex-none">
            <input type="hidden" name="pagesRead" value={amount} />
            <input type="hidden" name="date" value={dayValue} />
            <SubmitButton className="btn-primary touch-target w-full sm:w-auto">
              +{amount} {amount === 1 ? "page" : "pages"}
            </SubmitButton>
          </form>
        ))}
        <form action={logQuran} className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <input type="hidden" name="date" value={dayValue} />
          <input
            name="pagesRead"
            type="number"
            min={1}
            defaultValue={1}
            className="input sm:w-24"
            aria-label="Custom pages"
          />
          <input name="note" className="input min-w-0 flex-1" placeholder="note (optional)" />
          <SubmitButton className="btn-ghost touch-target">Log</SubmitButton>
        </form>
      </div>

      <details className="mt-4">
        <summary className="cursor-pointer text-sm font-medium text-brand-700 dark:text-brand-300">Set current page</summary>
        <form action={setQuranPosition} className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
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
        </form>
      </details>

      {sessions.length > 0 && (
        <div className="mt-4 space-y-1 border-t border-slate-100 pt-3 dark:border-slate-700">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Recent sessions</p>
          {sessions.map((session) => (
            <div key={session.id} className="flex items-start justify-between gap-3 text-sm text-slate-500 dark:text-slate-400">
              <span className="min-w-0">
                {formatDate(session.date)}
                {session.fromPage != null && session.toPage != null && (
                  <span className="ml-2 text-slate-400">
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
    </div>
  );
}
