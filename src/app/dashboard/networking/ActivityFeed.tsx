import Link from "next/link";
import { formatDate } from "@/lib/date";
import { parseTopics, INTERACTION_TYPE_LABELS, formatActivityDate } from "@/lib/networking";
import Icon from "@/components/Icon";
import ActionForm from "@/components/ActionForm";
import EmptyState from "@/components/EmptyState";
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
    return <EmptyState variant="inline" headingLevel="h3" icon="users" title={empty} />;
  }

  return (
    <ul className="divide-y divide-slate-100 dark:divide-slate-700">
      {items.map((it) => {
        const topics = parseTopics(it.topics);
        const typeLabel = INTERACTION_TYPE_LABELS[it.type] ?? it.type;
        return (
          <li key={it.id} className="flex items-start gap-3 py-3 text-sm first:pt-0 last:pb-0">
            <span className={`mt-0.5 capitalize ${it.type === "call" ? "badge-brand" : "badge-muted"}`}>
              {typeLabel}
            </span>
            <div className="min-w-0 flex-1">
              {showPerson && (
                <Link
                  href={`/dashboard/networking/${it.contactId}`}
                  className="font-medium text-slate-800 hover:underline dark:text-slate-100"
                >
                  {it.contactName}
                </Link>
              )}
              {it.summary && (
                <p className="whitespace-pre-line text-slate-700 dark:text-slate-200">{it.summary}</p>
              )}
              {topics.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {topics.map((topic) => (
                    <span key={topic} className="badge-muted">
                      {topic}
                    </span>
                  ))}
                </div>
              )}
              <p className="mt-1 text-xs text-muted">{formatActivityDate(it.date)}</p>
            </div>
            <ActionForm
              action={deleteInteraction}
              confirm={{
                title: `Delete this ${typeLabel.toLowerCase()} log?`,
                message: `${it.contactName} · ${formatDate(it.date)}. This can't be undone.`,
              }}
              successMessage="Log deleted"
              className="-my-2 shrink-0"
            >
              <input type="hidden" name="id" value={it.id} />
              <input type="hidden" name="contactId" value={it.contactId} />
              <SubmitIconButton
                className="btn-icon-danger"
                icon={<Icon name="trash" className="h-4 w-4" />}
                aria-label={`Delete ${typeLabel.toLowerCase()} log with ${it.contactName} on ${formatDate(it.date)}`}
              />
            </ActionForm>
          </li>
        );
      })}
    </ul>
  );
}
