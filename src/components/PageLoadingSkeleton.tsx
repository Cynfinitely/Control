type Variant =
  | "default"
  | "list"
  | "form"
  | "calendar"
  | "todos"
  | "religious"
  | "career"
  | "planner"
  | "plan"
  | "goals";

type Props = {
  variant?: Variant;
};

function Skeleton({ className }: { className?: string }) {
  return <div className={`skeleton ${className ?? ""}`} />;
}

function Wrapper({ className = "space-y-6", children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={className} role="status" aria-busy="true">
      <span className="sr-only">Loading…</span>
      {children}
    </div>
  );
}

function HeaderSkeleton({ titleWidth = "w-40", descWidth = "w-64" }: { titleWidth?: string; descWidth?: string }) {
  return (
    <div>
      <Skeleton className={`h-8 ${titleWidth}`} />
      <Skeleton className={`mt-2 h-4 ${descWidth}`} />
    </div>
  );
}

export default function PageLoadingSkeleton({ variant = "default" }: Props) {
  if (variant === "list") {
    return (
      <Wrapper>
        <HeaderSkeleton />
        <Skeleton className="h-28 w-full rounded-xl" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      </Wrapper>
    );
  }

  if (variant === "form") {
    return (
      <Wrapper>
        <HeaderSkeleton />
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="card space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-28" />
          </div>
        ))}
      </Wrapper>
    );
  }

  if (variant === "calendar") {
    return (
      <Wrapper className="space-y-4">
        <HeaderSkeleton titleWidth="w-36" descWidth="w-80" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-11 w-72 rounded-lg" />
        <Skeleton className="h-[28rem] w-full rounded-xl" />
      </Wrapper>
    );
  }

  if (variant === "todos") {
    return (
      <Wrapper className="space-y-6">
        <div>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      </Wrapper>
    );
  }

  if (variant === "religious") {
    return (
      <Wrapper className="space-y-6">
        <div>
          <Skeleton className="h-8 w-36" />
          <Skeleton className="mt-2 h-4 w-80" />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-56 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      </Wrapper>
    );
  }

  if (variant === "career") {
    return (
      <Wrapper className="space-y-8">
        <div>
          <Skeleton className="h-8 w-28" />
          <Skeleton className="mt-2 h-4 w-72" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        ))}
      </Wrapper>
    );
  }

  if (variant === "planner") {
    return (
      <Wrapper className="space-y-6 motion-reduce:animate-none">
        <div>
          <Skeleton className="h-8 w-40" />
          <Skeleton className="mt-2 h-4 w-56" />
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-40 w-full rounded-xl" />
      </Wrapper>
    );
  }

  if (variant === "plan") {
    return (
      <Wrapper className="space-y-6">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Skeleton className="h-48 w-full rounded-xl lg:col-span-2" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </Wrapper>
    );
  }

  if (variant === "goals") {
    return (
      <Wrapper className="space-y-6">
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-14 w-full rounded-xl" />
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      </Wrapper>
    );
  }

  return (
    <Wrapper className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-64" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    </Wrapper>
  );
}
