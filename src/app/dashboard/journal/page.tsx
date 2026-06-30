import { requireUser } from "@/lib/session";
import { toDateInputValue, formatDayLabel, parseDayParam } from "@/lib/date";
import { prisma } from "@/lib/db";
import PageHeader from "@/components/PageHeader";
import DayNavigator from "@/components/DayNavigator";
import SubmitButton from "@/components/SubmitButton";
import { saveJournalEntry } from "./actions";

export default async function JournalPage({
  searchParams,
}: {
  searchParams: { day?: string };
}) {
  const user = await requireUser();
  const day = parseDayParam(searchParams.day);
  const dayValue = toDateInputValue(day);
  const dayLabel = formatDayLabel(day);

  const entry = await prisma.journalEntry.findUnique({
    where: { userId_date: { userId: user.id, date: new Date(dayValue + "T00:00:00") } },
  });

  return (
    <div>
      <PageHeader
        title="Journal"
        description="Daily reflection — mood, wins, blockers, and notes."
      />

      <div className="card mb-6">
        <DayNavigator basePath="/dashboard/journal" dayValue={dayValue} dayLabel={dayLabel} />
      </div>

      <form action={saveJournalEntry} className="card space-y-4">
        <input type="hidden" name="date" value={dayValue} />
        <div>
          <label className="label">Mood (1–5)</label>
          <select name="mood" className="input w-32" defaultValue={entry?.mood ?? ""}>
            <option value="">—</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Wins</label>
          <textarea
            name="wins"
            className="input"
            rows={2}
            placeholder="What went well?"
            defaultValue={entry?.wins ?? ""}
          />
        </div>
        <div>
          <label className="label">Blockers</label>
          <textarea
            name="blockers"
            className="input"
            rows={2}
            placeholder="What got in the way?"
            defaultValue={entry?.blockers ?? ""}
          />
        </div>
        <div>
          <label className="label">Notes</label>
          <textarea
            name="note"
            className="input"
            rows={3}
            placeholder="Anything else on your mind…"
            defaultValue={entry?.note ?? ""}
          />
        </div>
        <SubmitButton className="btn-primary touch-target">Save entry</SubmitButton>
      </form>
    </div>
  );
}
