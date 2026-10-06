import Spinner from "@/components/Spinner";

export default function Loading() {
  return (
    <div className="card flex items-center justify-center gap-2 py-10 text-sm text-muted" role="status">
      <Spinner />
      Loading…
    </div>
  );
}
