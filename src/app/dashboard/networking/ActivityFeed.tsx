import Link from "next/link";
import { formatDate, formatDaysAgo } from "@/lib/date";
import { parseTopics, INTERACTION_TYPE_LABELS } from "@/lib/networking";
import Icon from "@/components/Icon";
import SubmitIconButton from "@/components/SubmitIconButton";
import { deleteInteraction } from "./actions";
import type { ActivityItem } from "@/lib/queries/networking";

export default function ActivityFeed({
  items,
  showPerson = true,
  empty = "No logs yet.",
}: {
  items: ActivityItem[];
  showPerson?: boolean;
  empty?: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-400">{empty}</p>;
  }

  return (
    <div className="space-y-2">
      {items.map((it) => {
        const topics = parseTopics(it.topics);
        return (
          <div key={it.id} className="flex items-start gap-3 border-t border-slate-100 pt-3 text-sm dark:border-slate-700">
            <span
              className={`badge mt-0.5 capitalize ${
                it.type === "call" ? "bg-brand-50 text-brand-700" : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300"
              }`}
            >
              {INTERACTION_TYPE_LABELS[it.type] ?? it.type}
            </span>
            <div className="min-w-0 flex-1">
              {showPerson && (
                <Link href={`/dashboard/networking/${it.contactId}`} className="font-medium text-slate-800 hover:underline dark:text-slate-100">
                  {it.contactName}
                </Link>
              )}
              {it.summary && <p className="text-slate-700 dark:text-slate-200">{it.summary}</p>}
              {topics.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {topics.map((topic) => (
                    <span key={topic} className="badge bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                      {topic}
                    </span>
                  ))}
                </div>
              )}
              <p className="mt-1 text-xs text-slate-400">
                {formatDate(it.date)} · {formatDaysAgo(it.date)}
              </p>
            </div>
            <form action={deleteInteraction}>
              <input type="hidden" name="id" value={it.id} />
              <input type="hidden" name="contactId" value={it.contactId} />
              <SubmitIconButton
                className="text-slate-300 hover:text-red-500"
                icon={<Icon name="trash" className="h-3 w-3" />}
                aria-label="Delete log"
              />
            </form>
          </div>
        );
      })}
    </div>
  );
}
