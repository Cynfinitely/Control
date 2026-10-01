import { requireUser } from "@/lib/session";
import { toDateInputValue, formatDate, formatDayLabel, parseDayParam } from "@/lib/date";
import { getDayPrayers, getPrayerStreak, getReligiousSidebarData } from "@/lib/queries/religious";
import { historicalDebtRemaining, prayerDebtRemaining, PRAYERS } from "@/lib/prayer-debt";
import { groupPendingQaza, prayerLabel } from "@/lib/religious/day-prayers";
import { khatmPercent, QURAN_TOTAL_PAGES } from "@/lib/quran";
import PageHeader from "@/components/PageHeader";
import DayNavigator from "@/components/DayNavigator";
import ActionForm from "@/components/ActionForm";
import CollapsibleSection from "@/components/CollapsibleSection";
import FormField from "@/components/FormField";
import Icon from "@/components/Icon";
import StatCard from "@/components/StatCard";
import SubmitButton from "@/components/SubmitButton";
import SubmitIconButton from "@/components/SubmitIconButton";
import PrayerStatusPanel from "./PrayerStatusPanel";
import PrayerDebtSetup from "./PrayerDebtSetup";
import QuranKhatmCard from "./QuranKhatmCard";
import DailyReadingsPanel from "./DailyReadingsPanel";
import {
  fulfillQazaForPrayer,
  fulfillPrayerDebt,
  clearPrayerDebt,
  logDhikr,
  logFasting,
  saveDhikrTarget,
  deleteDhikrTarget,
} from "./actions";

export const metadata = { title: "Religious" };

function TodayBadge() {
  return <span className="badge-brand">Today</span>;
}

function ProgressBar({ pct, label, className }: { pct: number; label: string; className?: string }) {
  const value = Math.round(Math.min(100, Math.max(0, pct)));
  return (
    <div
      className={`h-1.5 w-full overflow-hidden rounded-full progress-track ${className ?? ""}`}
      role="progressbar"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="h-full bg-brand-500" style={{ width: `${value}%` }} />
    </div>
  );
}

export default async function ReligiousPage({
  searchParams,
}: {
  searchParams: { day?: string };
}) {
  const user = await requireUser();
  const now = new Date();
  const today = new Date(toDateInputValue(now) + "T00:00:00");
  const day = parseDayParam(searchParams.day);
  const dayValue = toDateInputValue(day);
  const dayLabel = formatDayLabel(day);
  const isToday = day.getTime() === today.getTime();
  const todayValue = toDateInputValue(now);

  const [dayPrayers, streak, sidebar] = await Promise.all([
    getDayPrayers(user.id, dayValue),
    getPrayerStreak(user.id, todayValue),
    getReligiousSidebarData(user.id, todayValue),
  ]);

  const { pendingQaza, prayerDebts, dhikr, quran, fasts, dhikrTargets, quranState, readingItems, readingEntries } =
    sidebar;
  const currentPage = quranState?.currentPage ?? 1;
  const khatmsCompleted = quranState?.khatmsCompleted ?? 0;

  const prayerStatuses = Object.fromEntries(
    PRAYERS.map((p) => [p, dayPrayers.find((t) => t.prayer === p)?.status])
  );

  const qazaGroups = groupPendingQaza(pendingQaza);

  const historicalRemaining = historicalDebtRemaining(prayerDebts);
  const dailyQazaCount = pendingQaza.length;
  const totalQaza = dailyQazaCount + historicalRemaining;
  const debtWithRemaining = prayerDebts
    .map((d) => ({ ...d, remaining: prayerDebtRemaining(d) }))
    .filter((d) => d.remaining > 0)
    .sort((a, b) => PRAYERS.indexOf(a.prayer as never) - PRAYERS.indexOf(b.prayer as never));

  const dhikrTotal = dhikr.reduce((s, d) => s + d.count, 0);
  const dayName = isToday ? "today" : dayLabel === "Yesterday" ? "yesterday" : dayLabel;
  const prayerSectionTitle = `Prayers for ${dayName}`;

  return (
    <div>
      <PageHeader
        title="Religious"
        description="Track daily prayers, qaza, dhikr, Quran khatm, daily readings, and fasting."
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <StatCard label="On-time streak" value={streak} hint="days with all 5 on time" />
        <StatCard
          label="Qaza pending"
          value={totalQaza}
          hint={`${dailyQazaCount} daily · ${historicalRemaining} historical`}
        />
        <StatCard label="Dhikr today" value={dhikrTotal} />
        <StatCard
          label="Quran page"
          value={
            <>
              {currentPage}
              <span className="text-base font-medium text-muted">/{QURAN_TOTAL_PAGES}</span>
            </>
          }
          progress={khatmPercent(currentPage)}
          hint={`${khatmPercent(currentPage)}% of khatm`}
        />
      </div>

      <section className="card mb-6" aria-labelledby="prayers-title">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 id="prayers-title" className="section-title">
            {prayerSectionTitle}
          </h2>
          <DayNavigator basePath="/dashboard/religious" dayValue={dayValue} dayLabel={dayLabel} maxDay={todayValue} />
        </div>
        {!isToday && (
          <p className="mb-4 flex items-start gap-1.5 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
            <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              You’re editing prayers for {formatDate(day)}. Dhikr, Quran, readings and fasting below still log to
              today.
            </span>
          </p>
        )}
        <PrayerStatusPanel key={dayValue} dayValue={dayValue} dayName={dayName} initialStatuses={prayerStatuses} />
      </section>

      {qazaGroups.length > 0 && (
        <section className="card mb-6" aria-labelledby="qaza-title">
          <h2 id="qaza-title" className="section-title">
            Daily qaza
          </h2>
          <p className="mb-4 mt-1 text-sm text-muted">
            Prayers you mark missed land here. When you make one up, fulfil it; the oldest is fulfilled first.
          </p>
          <ul className="divide-y divide-slate-100 dark:divide-slate-700">
            {qazaGroups.map(({ prayer, count, items, oldest, newest }) => {
              const label = prayerLabel(prayer);
              return (
                <li key={prayer} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800 dark:text-slate-100">
                        {label} <span className="badge-warning ml-1 tabular-nums">{count} pending</span>
                      </p>
                      {oldest && (
                        <p className="mt-0.5 text-xs text-muted">
                          {count === 1 || !newest || formatDate(oldest) === formatDate(newest)
                            ? `From ${formatDate(oldest)}`
                            : `${formatDate(oldest)} – ${formatDate(newest)}`}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-end gap-2">
                      <ActionForm action={fulfillQazaForPrayer}>
                        <input type="hidden" name="prayer" value={prayer} />
                        <input type="hidden" name="amount" value="1" />
                        <SubmitButton className="btn-primary touch-target" aria-label={`Fulfill one ${label} qaza`}>
                          Fulfill one
                        </SubmitButton>
                      </ActionForm>
                      {count > 1 && (
                        <ActionForm action={fulfillQazaForPrayer} className="flex items-end gap-2">
                          <input type="hidden" name="prayer" value={prayer} />
                          <FormField label={`How many ${label}`} hideLabel>
                            {(_id, aria) => (
                              <input
                                {...aria}
                                name="amount"
                                type="number"
                                min={1}
                                max={count}
                                defaultValue={count}
                                inputMode="numeric"
                                className="input w-20"
                              />
                            )}
                          </FormField>
                          <SubmitButton className="btn-ghost touch-target">Fulfill</SubmitButton>
                        </ActionForm>
                      )}
                    </div>
                  </div>
                  {count > 1 && (
                    <CollapsibleSection title="Show dates" className="mt-2 text-sm">
                      <ul className="flex flex-wrap gap-1.5">
                        {items.map((q) => (
                          <li key={q.id} className="badge-muted">
                            {formatDate(q.sourceDate)}
                          </li>
                        ))}
                      </ul>
                    </CollapsibleSection>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="card mb-6" aria-labelledby="debt-title">
        <h2 id="debt-title" className="section-title mb-2">
          Historical prayer debt
        </h2>
        {debtWithRemaining.length > 0 ? (
          <div className="space-y-4">
            {prayerDebts[0]?.note && <p className="text-sm text-muted">{prayerDebts[0].note}</p>}
            {(prayerDebts[0]?.periodStart || prayerDebts[0]?.periodEnd) && (
              <p className="text-xs text-muted">
                Period: {formatDate(prayerDebts[0]?.periodStart)} – {formatDate(prayerDebts[0]?.periodEnd)}
              </p>
            )}
            <ul className="space-y-4">
              {debtWithRemaining.map((d) => {
                const pct = d.owed > 0 ? Math.round((d.fulfilled / d.owed) * 100) : 0;
                const label = prayerLabel(d.prayer);
                return (
                  <li key={d.prayer}>
                    <div className="mb-1 flex flex-wrap items-center justify-between gap-x-3 text-sm">
                      <span className="font-medium text-slate-800 dark:text-slate-100">{label}</span>
                      <span className="text-muted">
                        {d.fulfilled}/{d.owed} fulfilled · {d.remaining} left
                      </span>
                    </div>
                    <ProgressBar pct={pct} label={`${label} historical debt fulfilled`} className="mb-2" />
                    <div className="flex flex-wrap items-end gap-2">
                      <ActionForm action={fulfillPrayerDebt}>
                        <input type="hidden" name="prayer" value={d.prayer} />
                        <input type="hidden" name="amount" value="1" />
                        <SubmitButton className="btn-ghost touch-target" aria-label={`Fulfill one ${label}`}>
                          Fulfill 1
                        </SubmitButton>
                      </ActionForm>
                      <ActionForm action={fulfillPrayerDebt} className="flex items-end gap-2">
                        <input type="hidden" name="prayer" value={d.prayer} />
                        <FormField label={`How many ${label}`} hideLabel>
                          {(_id, aria) => (
                            <input
                              {...aria}
                              name="amount"
                              type="number"
                              min={1}
                              max={d.remaining}
                              defaultValue={Math.min(5, d.remaining)}
                              inputMode="numeric"
                              className="input w-20"
                            />
                          )}
                        </FormField>
                        <SubmitButton className="btn-ghost touch-target">Fulfill</SubmitButton>
                      </ActionForm>
                    </div>
                  </li>
                );
              })}
            </ul>
            <ActionForm
              action={clearPrayerDebt}
              confirm={{
                title: "Clear all historical prayer debt?",
                message:
                  "Every owed count and all fulfilment progress for historical debt will be deleted. Daily qaza is not affected.",
                confirmLabel: "Clear debt",
              }}
            >
              <SubmitButton className="btn-danger touch-target">
                <Icon name="trash" className="h-4 w-4" />
                Clear all historical debt
              </SubmitButton>
            </ActionForm>
          </div>
        ) : (
          <p className="mb-2 text-sm text-muted">
            No historical debt logged yet. Use the setup below if you owe prayers from before you started tracking.
          </p>
        )}
        <CollapsibleSection
          title={debtWithRemaining.length > 0 ? "Update historical debt" : "Set up historical debt"}
          className="mt-4"
        >
          <PrayerDebtSetup existingDebts={prayerDebts} />
        </CollapsibleSection>
      </section>

      <QuranKhatmCard currentPage={currentPage} khatmsCompleted={khatmsCompleted} sessions={quran} dayValue={todayValue} />

      <DailyReadingsPanel items={readingItems} todayEntries={readingEntries} dayValue={todayValue} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="card" aria-labelledby="dhikr-title">
          <div className="flex items-center gap-2">
            <h2 id="dhikr-title" className="section-title">
              Dhikr
            </h2>
            <TodayBadge />
          </div>
          <ActionForm action={logDhikr} className="mt-3 space-y-3">
            <FormField label="Dhikr">
              {(_id, aria) => <input {...aria} name="name" className="input" placeholder="e.g. Subhanallah" required list="dhikr-names" />}
            </FormField>
            {dhikrTargets.length > 0 && (
              <datalist id="dhikr-names">
                {dhikrTargets.map((t) => (
                  <option key={t.id} value={t.name} />
                ))}
              </datalist>
            )}
            <FormField label="Count">
              {(_id, aria) => (
                <input {...aria} name="count" type="number" min={1} inputMode="numeric" className="input" defaultValue={33} />
              )}
            </FormField>
            <input type="hidden" name="date" value={todayValue} />
            <SubmitButton className="btn-primary touch-target w-full">Log dhikr</SubmitButton>
          </ActionForm>
          {dhikrTargets.length > 0 && (
            <div className="mt-4 space-y-3">
              <h3 className="subsection-title">Daily targets</h3>
              {dhikrTargets.map((t) => {
                const logged = dhikr.filter((d) => d.name === t.name).reduce((s, d) => s + d.count, 0);
                const pct = t.dailyTarget > 0 ? (logged / t.dailyTarget) * 100 : 0;
                const done = logged >= t.dailyTarget;
                return (
                  <div key={t.id}>
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="text-slate-800 dark:text-slate-100">{t.name}</span>
                      <span className="flex items-center gap-2 text-muted">
                        {done && (
                          <span className="badge-success">
                            <Icon name="check" className="h-3.5 w-3.5" />
                            Done
                          </span>
                        )}
                        {logged}/{t.dailyTarget}
                      </span>
                    </div>
                    <ProgressBar pct={pct} label={`${t.name} daily target`} className="mt-1" />
                  </div>
                );
              })}
            </div>
          )}
          <CollapsibleSection title="Manage targets" className="mt-4">
            <ActionForm
              action={saveDhikrTarget}
              resetOnSuccess
              className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_6rem_auto] sm:items-end"
            >
              <FormField label="Dhikr name">
                {(_id, aria) => <input {...aria} name="name" className="input" required />}
              </FormField>
              <FormField label="Per day">
                {(_id, aria) => (
                  <input {...aria} name="dailyTarget" type="number" min={1} inputMode="numeric" className="input" defaultValue={33} />
                )}
              </FormField>
              <SubmitButton className="btn-ghost touch-target">Set target</SubmitButton>
            </ActionForm>
            {dhikrTargets.length > 0 && (
              <ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-700">
                {dhikrTargets.map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="text-muted">
                      {t.name} · {t.dailyTarget}/day
                    </span>
                    <ActionForm
                      action={deleteDhikrTarget}
                      confirm={{
                        title: `Remove the “${t.name}” target?`,
                        message: "Logged dhikr is kept; only the daily target is removed.",
                        confirmLabel: "Remove",
                      }}
                    >
                      <input type="hidden" name="id" value={t.id} />
                      <SubmitIconButton
                        className="btn-icon-danger"
                        aria-label={`Remove ${t.name} target`}
                        icon={<Icon name="trash" className="h-4 w-4" />}
                      />
                    </ActionForm>
                  </li>
                ))}
              </ul>
            )}
          </CollapsibleSection>
          <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-700">
            <h3 className="subsection-title">Logged today</h3>
            {dhikr.length === 0 ? (
              <p className="mt-1 text-sm text-muted">Nothing logged yet today.</p>
            ) : (
              <ul className="mt-1 space-y-1">
                {dhikr.map((d) => (
                  <li key={d.id} className="flex justify-between text-sm text-muted">
                    <span>{d.name}</span>
                    <span className="font-medium tabular-nums text-slate-700 dark:text-slate-100">{d.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="card" aria-labelledby="fasting-title">
          <h2 id="fasting-title" className="section-title">
            Fasting
          </h2>
          <ActionForm action={logFasting} className="mt-3 space-y-3">
            <FormField label="Date">
              {(_id, aria) => <input {...aria} type="date" name="date" className="input" defaultValue={todayValue} max={todayValue} />}
            </FormField>
            <FormField label="Kind">
              {(_id, aria) => (
                <select {...aria} name="kind" className="input" defaultValue="ramadan">
                  <option value="ramadan">Ramadan</option>
                  <option value="voluntary">Voluntary</option>
                  <option value="makeup">Make-up (qada)</option>
                </select>
              )}
            </FormField>
            <FormField
              label={
                <>
                  Note <span className="font-normal text-muted">(optional)</span>
                </>
              }
            >
              {(_id, aria) => <input {...aria} name="note" className="input" />}
            </FormField>
            <SubmitButton className="btn-primary touch-target w-full">Log fast</SubmitButton>
          </ActionForm>
          <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-700">
            <h3 className="subsection-title">Recent fasts</h3>
            {fasts.length === 0 ? (
              <p className="mt-1 text-sm text-muted">No fasts logged yet.</p>
            ) : (
              <ul className="mt-1 space-y-1">
                {fasts.map((f) => (
                  <li key={f.id} className="flex justify-between text-sm text-muted">
                    <span>{formatDate(f.date)}</span>
                    <span className="badge-muted capitalize">{f.kind === "makeup" ? "Make-up" : f.kind}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
