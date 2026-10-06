import { Suspense } from "react";
import { requireModule } from "@/lib/session";
import { toDateInputValue, formatDayLabel, parseDayParam } from "@/lib/date";
import { prisma } from "@/lib/db";
import PageHeader from "@/components/PageHeader";
import DayNavigator from "@/components/DayNavigator";
import FocusTarget from "@/components/FocusTarget";
import JournalForm from "./JournalForm";

export const metadata = { title: "Journal" };

export default async function JournalPage({
  searchParams,
}: {
  searchParams: { day?: string; focus?: string };
}) {
  const user = await requireModule("journal");
  const day = parseDayParam(searchParams.day);
  const dayValue = toDateInputValue(day);
  const dayLabel = formatDayLabel(day);

  const entry = await prisma.journalEntry.findUnique({
    where: { userId_date: { userId: user.id, date: new Date(dayValue + "T00:00:00") } },
  });

  const initial = {
    mood: entry?.mood ? String(entry.mood) : "",
    wins: entry?.wins ?? "",
    blockers: entry?.blockers ?? "",
    note: entry?.note ?? "",
  };

  return (
    <div>
      <PageHeader help="journal"
        title="Journal"
        description="Daily reflection — mood, wins, blockers, and notes."
      />

      <div className="mb-6">
        <DayNavigator basePath="/dashboard/journal" dayValue={dayValue} dayLabel={dayLabel} />
      </div>

      <Suspense fallback={<JournalForm key={dayValue} dayValue={dayValue} dayLabel={dayLabel} initial={initial} />}>
        <FocusTarget>
          <JournalForm key={dayValue} dayValue={dayValue} dayLabel={dayLabel} initial={initial} />
        </FocusTarget>
      </Suspense>
    </div>
  );
}
