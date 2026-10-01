export default function PageHeader({
  title,
  description,
  action,
  breadcrumb,
  children,
}: {
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  /** Rendered above the title (e.g. <Breadcrumb />). */
  breadcrumb?: React.ReactNode;
  /** Rendered below the title row (e.g. section <TabNav />). */
  children?: React.ReactNode;
}) {
  return (
    <header className="mb-6">
      {breadcrumb}
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{title}</h1>
          {description && <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{description}</p>}
        </div>
        {action ? (
          <div className="flex shrink-0 flex-wrap gap-2 sm:pt-0.5 [&>a]:flex-1 [&>button]:flex-1 sm:[&>a]:flex-none sm:[&>button]:flex-none">
            {action}
          </div>
        ) : null}
      </div>
      {children && <div className="mt-4">{children}</div>}
    </header>
  );
}
