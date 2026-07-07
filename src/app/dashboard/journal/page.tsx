import { requireUser } from "@/lib/session";
import { toDateInputValue, formatDayLabel, parseDayParam } from "@/lib/date";
import { prisma } from "@/lib/db";
import PageHeader from "@/components/PageHeader";
import DayNavigator from "@/components/DayNavigator";
import SubmitButton from "@/components/SubmitButton";
import FormAction from "@/components/FormAction";
import EmptyState from "@/components/EmptyState";
import { saveJournalEntryForm } from "./actions";

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

  const isEmpty = !entry?.wins && !entry?.blockers && !entry?.note && !entry?.mood;

  return (
    <div>
      <PageHeader
        title="Journal"
        description="Daily reflection — mood, wins, blockers, and notes."
      />

      <div className="card mb-6">
        <DayNavigator basePath="/dashboard/journal" dayValue={dayValue} dayLabel={dayLabel} />
      </div>

      {isEmpty && (
        <EmptyState
          icon="book"
          title="Start today's reflection"
          description="Capture your mood, wins, and blockers to build a daily habit of self-awareness."
          tip="Even a few words each day adds up over time."
        />
      )}

      <FormAction action={saveJournalEntryForm} successMessage="Journal saved" className="card space-y-4">
        <input type="hidden" name="date" value={dayValue} />
        <div>
          <label htmlFor="journal-mood" className="label">
            Mood (1–5)
          </label>
          <select id="journal-mood" name="mood" className="input w-32" defaultValue={entry?.mood ?? ""}>
            <option value="">—</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="journal-wins" className="label">
            Wins
          </label>
          <textarea
            id="journal-wins"
            name="wins"
            className="input"
            rows={2}
            placeholder="What went well?"
            defaultValue={entry?.wins ?? ""}
          />
        </div>
        <div>
          <label htmlFor="journal-blockers" className="label">
            Blockers
          </label>
          <textarea
            id="journal-blockers"
            name="blockers"
            className="input"
            rows={2}
            placeholder="What got in the way?"
            defaultValue={entry?.blockers ?? ""}
          />
        </div>
        <div>
          <label htmlFor="journal-note" className="label">
            Notes
          </label>
          <textarea
            id="journal-note"
            name="note"
            className="input"
            rows={3}
            placeholder="Anything else on your mind…"
            defaultValue={entry?.note ?? ""}
          />
        </div>
        <SubmitButton className="btn-primary touch-target">Save entry</SubmitButton>
      </FormAction>
    </div>
  );
}
