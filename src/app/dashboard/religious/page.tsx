import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { startOfDay, endOfDay, toDateInputValue, formatDate, addDays } from "@/lib/date";
import PageHeader from "@/components/PageHeader";
import { setPrayer, logDhikr, logQuran, logFasting } from "./actions";

const PRAYERS = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
const STATUSES = [
  { value: "ontime", label: "On time", style: "bg-green-100 text-green-700" },
  { value: "late", label: "Late", style: "bg-amber-100 text-amber-700" },
  { value: "missed", label: "Missed", style: "bg-red-100 text-red-700" },
  { value: "na", label: "N/A", style: "bg-slate-100 text-slate-500" },
];

export default async function ReligiousPage() {
  const user = await requireUser();
  const now = new Date();
  const today = startOfDay(now);

  const [todayPrayers, recentPrayers, dhikr, quran, fasts] = await Promise.all([
    prisma.prayerLog.findMany({ where: { userId: user.id, date: { gte: today, lte: endOfDay(now) } } }),
    prisma.prayerLog.findMany({
      where: { userId: user.id, date: { gte: addDays(today, -60) } },
    }),
    prisma.dhikrLog.findMany({
      where: { userId: user.id, date: { gte: today, lte: endOfDay(now) } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.quranProgress.findMany({
      where: { userId: user.id },
      orderBy: { date: "desc" },
      take: 7,
    }),
    prisma.fastingLog.findMany({
      where: { userId: user.id },
      orderBy: { date: "desc" },
      take: 7,
    }),
  ]);

  const prayerStatus = (p: string) => todayPrayers.find((t) => t.prayer === p)?.status;

  // streak: consecutive days (ending today/yesterday) with all 5 prayers logged (non-missed)
  const byDay = new Map<string, number>();
  for (const p of recentPrayers) {
    if (p.status === "missed") continue;
    const key = toDateInputValue(p.date);
    byDay.set(key, (byDay.get(key) ?? 0) + 1);
  }
  let streak = 0;
  for (let i = 0; i < 60; i++) {
    const key = toDateInputValue(addDays(today, -i));
    if ((byDay.get(key) ?? 0) >= 5) streak++;
    else if (i === 0) continue; // allow today to be incomplete
    else break;
  }

  const dhikrTotal = dhikr.reduce((s, d) => s + d.count, 0);

  return (
    <div>
      <PageHeader
        title="Religious"
        description="Track daily prayers, dhikr, Quran reading, and fasting."
      />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="card">
          <p className="text-sm text-slate-500">Prayer streak</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{streak}</p>
          <p className="text-xs text-slate-400">days all prayers kept</p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500">Dhikr today</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{dhikrTotal}</p>
          <p className="text-xs text-slate-400">total count</p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500">Quran (last log)</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{quran[0]?.pagesRead ?? 0}</p>
          <p className="text-xs text-slate-400">pages</p>
        </div>
      </div>

      <div className="card mb-6">
        <h2 className="section-title mb-4">Today&apos;s prayers</h2>
        <div className="space-y-3">
          {PRAYERS.map((p) => {
            const current = prayerStatus(p);
            return (
              <div key={p} className="flex items-center gap-3">
                <span className="w-20 font-medium capitalize text-slate-700">{p}</span>
                <div className="flex flex-wrap gap-2">
                  {STATUSES.map((s) => (
                    <form key={s.value} action={setPrayer}>
                      <input type="hidden" name="prayer" value={p} />
                      <input type="hidden" name="status" value={s.value} />
                      <input type="hidden" name="date" value={toDateInputValue(now)} />
                      <button
                        className={`badge ${
                          current === s.value
                            ? s.style + " ring-2 ring-offset-1 ring-slate-300"
                            : "bg-white text-slate-400 ring-1 ring-inset ring-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {s.label}
                      </button>
                    </form>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card">
          <h2 className="section-title">Dhikr</h2>
          <form action={logDhikr} className="mt-3 space-y-2">
            <input name="name" className="input" placeholder="e.g. Subhanallah" required />
            <input name="count" type="number" className="input" placeholder="count" defaultValue={33} />
            <input type="hidden" name="date" value={toDateInputValue(now)} />
            <button className="btn-primary w-full">Log dhikr</button>
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
            <button className="btn-primary w-full">Log reading</button>
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
            <button className="btn-primary w-full">Log fast</button>
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
