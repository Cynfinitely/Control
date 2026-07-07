import Spinner from "@/components/Spinner";

export default function PendingIndicator({ pending }: { pending: boolean }) {
  if (!pending) return null;
  return (
    <div
      aria-live="polite"
      className="mb-2 inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 dark:bg-brand-950 dark:text-brand-300"
    >
      <Spinner className="h-3 w-3" />
      Saving…
    </div>
  );
}
