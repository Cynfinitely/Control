import { requireUser } from "@/lib/session";
import {
  toDateInputValue,
  formatDate,
  formatDayLabel,
  parseDayParam,
} from "@/lib/date";
import { getDayPrayers, getPrayerStreak, getReligiousSidebarData } from "@/lib/queries/religious";
import PageHeader from "@/components/PageHeader";
import DayNavigator from "@/components/DayNavigator";
import SubmitButton from "@/components/SubmitButton";
import PrayerStatusPanel from "./PrayerStatusPanel";
import { fulfillQaza, logDhikr, logQuran, logFasting } from "./actions";

const PRAYERS = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

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

  const { pendingQaza, dhikr, quran, fasts } = sidebar;

  const prayerStatuses = Object.fromEntries(
    PRAYERS.map((p) => [p, dayPrayers.find((t) => t.prayer === p)?.status])
  );

  const qazaCounts = PRAYERS.map((prayer) => ({
    prayer,
    count: pendingQaza.filter((q) => q.prayer === prayer).length,
    items: pendingQaza.filter((q) => q.prayer === prayer),
  })).filter((q) => q.count > 0);

  const totalQaza = pendingQaza.length;
  const dhikrTotal = dhikr.reduce((s, d) => s + d.count, 0);
  const prayerSectionTitle = isToday ? "Today's prayers" : `Prayers — ${formatDayLabel(day)}`;

  return (
    <div>
      <PageHeader
        title="Religious"
        description="Track daily prayers, qaza makeup, dhikr, Quran, and fasting."
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
          <p className="text-xs text-slate-400">makeup prayers</p>
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
          <h2 className="section-title mb-4">Qaza prayers</h2>
          <p className="mb-4 text-sm text-slate-500">
            Missed prayers are added here automatically. Tap Fulfill when you make them up.
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card">
          <h2 className="section-title">Dhikr</h2>
          <form action={logDhikr} className="mt-3 space-y-2">
            <input name="name" className="input" placeholder="e.g. Subhanallah" required />
            <input name="count" type="number" className="input" placeholder="count" defaultValue={33} />
            <input type="hidden" name="date" value={toDateInputValue(now)} />
            <SubmitButton className="btn-primary touch-target w-full">Log dhikr</SubmitButton>
          </form>
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
