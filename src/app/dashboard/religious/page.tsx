import { requireUser } from "@/lib/session";
import {
  toDateInputValue,
  formatDate,
  formatDayLabel,
  parseDayParam,
} from "@/lib/date";
import { getDayPrayers, getPrayerStreak, getReligiousSidebarData } from "@/lib/queries/religious";
import { historicalDebtRemaining, prayerDebtRemaining, PRAYERS } from "@/lib/prayer-debt";
import PageHeader from "@/components/PageHeader";
import DayNavigator from "@/components/DayNavigator";
import SubmitButton from "@/components/SubmitButton";
import PrayerStatusPanel from "./PrayerStatusPanel";
import PrayerDebtSetup from "./PrayerDebtSetup";
import {
  fulfillQaza,
  fulfillPrayerDebt,
  clearPrayerDebt,
  logDhikr,
  logQuran,
  logFasting,
  saveDhikrTarget,
  deleteDhikrTarget,
} from "./actions";

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
  const todayKey = toDateInputValue(now);

  const [dayPrayers, streak, sidebar] = await Promise.all([
    getDayPrayers(user.id, dayValue),
    getPrayerStreak(user.id, todayKey),
    getReligiousSidebarData(user.id, todayKey),
  ]);

  const { pendingQaza, prayerDebts, dhikr, quran, fasts, dhikrTargets } = sidebar;

  const prayerStatuses = Object.fromEntries(
    PRAYERS.map((p) => [p, dayPrayers.find((t) => t.prayer === p)?.status])
  );

  const qazaCounts = PRAYERS.map((prayer) => ({
    prayer,
    count: pendingQaza.filter((q) => q.prayer === prayer).length,
    items: pendingQaza.filter((q) => q.prayer === prayer),
  })).filter((q) => q.count > 0);

  const historicalRemaining = historicalDebtRemaining(prayerDebts);
  const dailyQazaCount = pendingQaza.length;
  const totalQaza = dailyQazaCount + historicalRemaining;
  const debtWithRemaining = prayerDebts
    .map((d) => ({ ...d, remaining: prayerDebtRemaining(d) }))
    .filter((d) => d.remaining > 0);

  const dhikrTotal = dhikr.reduce((s, d) => s + d.count, 0);
  const prayerSectionTitle = isToday ? "Today's prayers" : `Prayers — ${formatDayLabel(day)}`;

  return (
    <div>
      <PageHeader
        title="Religious"
        description="Track daily prayers, qaza makeup, historical debt, dhikr, Quran, and fasting."
      />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="card">
          <p className="text-sm text-slate-500">On-time streak</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{streak}</p>
          <p className="text-xs text-slate-400">days all 5 on time</p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500">Qaza pending</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{totalQaza}</p>
          <p className="text-xs text-slate-400">
            {dailyQazaCount} daily · {historicalRemaining} historical
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500">Dhikr today</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{dhikrTotal}</p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500">Quran (last)</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{quran[0]?.pagesRead ?? 0}</p>
          <p className="text-xs text-slate-400">pages</p>
        </div>
      </div>

      <div className="card mb-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="section-title">{prayerSectionTitle}</h2>
          <DayNavigator
            basePath="/dashboard/religious"
            dayValue={dayValue}
            dayLabel={dayLabel}
            maxDay={todayValue}
          />
        </div>
        <PrayerStatusPanel dayValue={dayValue} initialStatuses={prayerStatuses} />
      </div>

      {qazaCounts.length > 0 && (
        <div className="card mb-6">
          <h2 className="section-title mb-4">Daily qaza</h2>
          <p className="mb-4 text-sm text-slate-500">
            Missed prayers from your daily log are added here automatically. Tap Fulfill when you
            make them up.
          </p>
          <div className="space-y-4">
            {qazaCounts.map(({ prayer, count, items }) => (
              <div key={prayer}>
                <p className="mb-2 font-medium capitalize text-slate-700">
                  {prayer} <span className="text-slate-400">× {count}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {items.map((q) => (
                    <form key={q.id} action={fulfillQaza}>
                      <input type="hidden" name="id" value={q.id} />
                      <SubmitButton className="btn-ghost touch-target text-sm">
                        Fulfill
                        {q.sourceDate && (
                          <span className="ml-1 text-xs text-slate-400">
                            ({formatDate(q.sourceDate)})
                          </span>
                        )}
                      </SubmitButton>
                    </form>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card mb-6">
        <h2 className="section-title mb-2">Historical prayer debt</h2>
        {debtWithRemaining.length > 0 ? (
          <div className="space-y-4">
            {prayerDebts[0]?.note && (
              <p className="text-sm text-slate-500">{prayerDebts[0].note}</p>
            )}
            {(prayerDebts[0]?.periodStart || prayerDebts[0]?.periodEnd) && (
              <p className="text-xs text-slate-400">
                Period: {prayerDebts[0]?.periodStart ? formatDate(prayerDebts[0].periodStart) : "?"}
                {" – "}
                {prayerDebts[0]?.periodEnd ? formatDate(prayerDebts[0].periodEnd) : "?"}
              </p>
            )}
            {debtWithRemaining.map((d) => {
              const pct = d.owed > 0 ? Math.round((d.fulfilled / d.owed) * 100) : 0;
              return (
                <div key={d.prayer}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium capitalize text-slate-700">{d.prayer}</span>
                    <span className="text-slate-500">
                      {d.fulfilled}/{d.owed} fulfilled · {d.remaining} left
                    </span>
                  </div>
                  <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full bg-brand-500" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <form action={fulfillPrayerDebt}>
                      <input type="hidden" name="prayer" value={d.prayer} />
                      <input type="hidden" name="amount" value="1" />
                      <SubmitButton className="btn-ghost touch-target text-sm">Fulfill 1</SubmitButton>
                    </form>
                    <form action={fulfillPrayerDebt} className="flex items-center gap-2">
                      <input type="hidden" name="prayer" value={d.prayer} />
                      <input
                        name="amount"
                        type="number"
                        min={1}
                        max={d.remaining}
                        defaultValue={5}
                        className="input w-16 py-1 text-sm"
                      />
                      <SubmitButton className="btn-ghost touch-target text-sm">Fulfill</SubmitButton>
                    </form>
                  </div>
                </div>
              );
            })}
            <form action={clearPrayerDebt}>
              <SubmitButton className="btn-ghost text-sm text-red-600">Clear all historical debt</SubmitButton>
            </form>
          </div>
        ) : (
          <p className="mb-4 text-sm text-slate-500">
            No historical debt logged yet. Use the setup below if you owe prayers from before you
            started tracking.
          </p>
        )}
        <details className="mt-4">
          <summary className="cursor-pointer font-medium text-brand-700">
            {debtWithRemaining.length > 0 ? "Update historical debt" : "Set up historical debt"}
          </summary>
          <PrayerDebtSetup existingDebts={prayerDebts} />
        </details>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card">
          <h2 className="section-title">Dhikr</h2>
          <form action={logDhikr} className="mt-3 space-y-2">
            <input name="name" className="input" placeholder="e.g. Subhanallah" required />
            <input name="count" type="number" className="input" placeholder="count" defaultValue={33} />
            <input type="hidden" name="date" value={toDateInputValue(now)} />
            <SubmitButton className="btn-primary touch-target w-full">Log dhikr</SubmitButton>
          </form>
          {dhikrTargets.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-medium text-slate-500">Daily targets</p>
              {dhikrTargets.map((t) => {
                const logged = dhikr.filter((d) => d.name === t.name).reduce((s, d) => s + d.count, 0);
                const pct = Math.min(100, Math.round((logged / t.dailyTarget) * 100));
                return (
                  <div key={t.id}>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-700">{t.name}</span>
                      <span className="text-slate-500">
                        {logged}/{t.dailyTarget}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full bg-brand-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <details className="mt-3">
            <summary className="cursor-pointer text-xs text-brand-600">Manage targets</summary>
            <form action={saveDhikrTarget} className="mt-2 flex flex-wrap gap-2">
              <input name="name" className="input flex-1 py-1 text-xs" placeholder="Dhikr name" required />
              <input name="dailyTarget" type="number" className="input w-20 py-1 text-xs" defaultValue={33} />
              <SubmitButton className="btn-ghost py-1 text-xs">Set</SubmitButton>
            </form>
            {dhikrTargets.map((t) => (
              <form key={t.id} action={deleteDhikrTarget} className="mt-1 flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  {t.name} · {t.dailyTarget}/day
                </span>
                <SubmitButton className="text-red-500">Remove</SubmitButton>
                <input type="hidden" name="id" value={t.id} />
              </form>
            ))}
          </details>
          <div className="mt-4 space-y-1">
            {dhikr.map((d) => (
              <div key={d.id} className="flex justify-between text-sm text-slate-500">
                <span>{d.name}</span>
                <span className="font-medium text-slate-700">{d.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="section-title">Quran</h2>
          <form action={logQuran} className="mt-3 space-y-2">
            <input name="pagesRead" type="number" className="input" placeholder="pages read" defaultValue={1} />
            <input name="note" className="input" placeholder="note (optional)" />
            <input type="hidden" name="date" value={toDateInputValue(now)} />
            <SubmitButton className="btn-primary touch-target w-full">Log reading</SubmitButton>
          </form>
          <div className="mt-4 space-y-1">
            {quran.map((q) => (
              <div key={q.id} className="flex justify-between text-sm text-slate-500">
                <span>{formatDate(q.date)}</span>
                <span className="font-medium text-slate-700">{q.pagesRead} pages</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="section-title">Fasting</h2>
          <form action={logFasting} className="mt-3 space-y-2">
            <input type="date" name="date" className="input" defaultValue={toDateInputValue(now)} />
            <select name="kind" className="input" defaultValue="ramadan">
              <option value="ramadan">Ramadan</option>
              <option value="voluntary">Voluntary</option>
              <option value="makeup">Make-up (qada)</option>
            </select>
            <input name="note" className="input" placeholder="note (optional)" />
            <SubmitButton className="btn-primary touch-target w-full">Log fast</SubmitButton>
          </form>
          <div className="mt-4 space-y-1">
            {fasts.map((f) => (
              <div key={f.id} className="flex justify-between text-sm text-slate-500">
                <span>{formatDate(f.date)}</span>
                <span className="badge bg-slate-100 capitalize text-slate-600">{f.kind}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
