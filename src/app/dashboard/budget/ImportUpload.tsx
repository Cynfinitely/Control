"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import Spinner from "@/components/Spinner";
import Icon from "@/components/Icon";
import IconButton from "@/components/IconButton";
import CollapsibleSection from "@/components/CollapsibleSection";
import { useToast } from "@/components/Toast";
import { formatRange } from "@/lib/date";
import { periodLabel } from "@/lib/period";
import { importNordeaFile, type ImportBudgetResult } from "./actions";

type Props = {
  /** No transactions yet: show the uploader as the page's prominent first step. */
  empty?: boolean;
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ImportUpload({ empty }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ImportBudgetResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleImport(formData: FormData, done: () => void) {
    setResult(null);
    setError(null);
    startTransition(async () => {
      try {
        const res = await importNordeaFile(formData);
        if (!res.ok) {
          setError(res.error);
          toast.error(res.error);
          return;
        }
        setResult(res);
        toast.success(res.message);
        done();
        router.refresh();
      } catch {
        const message = "Import failed. Check your connection and try again.";
        setError(message);
        toast.error(message);
      }
    });
  }

  const description = (
    <p className="text-sm text-slate-600 dark:text-slate-400">
      In Nordea Netbank, download your account transactions as CSV or TXT and upload the file here. Merchants you have
      categorized before are matched automatically.
    </p>
  );

  const form = (
    <ImportForm
      pending={pending}
      error={error}
      onClearError={() => setError(null)}
      onChooseFile={() => setResult(null)}
      onSubmit={handleImport}
    />
  );

  return (
    <div className="space-y-4">
      {result && <ImportSummary result={result} onDismiss={() => setResult(null)} />}
      {empty ? (
        <section className="card border-brand-200 bg-brand-50/40 dark:border-brand-800 dark:bg-brand-950/40">
          <h2 className="section-title">Import your first Nordea statement</h2>
          <div className="mt-1">{description}</div>
          {form}
        </section>
      ) : (
        <CollapsibleSection variant="card" icon="upload" title="Import Nordea CSV">
          {description}
          {form}
        </CollapsibleSection>
      )}
    </div>
  );
}

function ImportForm({
  pending,
  error,
  onClearError,
  onChooseFile,
  onSubmit,
}: {
  pending: boolean;
  error: string | null;
  onClearError: () => void;
  onChooseFile: () => void;
  onSubmit: (formData: FormData, done: () => void) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);

  function choose(next: File | null) {
    setFile(next);
    onClearError();
    if (next) onChooseFile();
  }

  function clear() {
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <form
      className="mt-4 space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(new FormData(e.currentTarget), clear);
      }}
    >
      <input
        ref={inputRef}
        id="nordea-file"
        name="file"
        type="file"
        accept=".csv,.txt,text/csv,text/plain"
        className="peer sr-only"
        required
        disabled={pending}
        aria-describedby="nordea-file-hint"
        onChange={(e) => choose(e.target.files?.[0] ?? null)}
      />
      <label
        htmlFor="nordea-file"
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const dropped = e.dataTransfer.files?.[0];
          if (!dropped || !inputRef.current) return;
          try {
            inputRef.current.files = e.dataTransfer.files;
          } catch {
            // Older browsers can't assign FileList; the user can still click to choose.
            return;
          }
          choose(dropped);
        }}
        className={clsx(
          "flex min-h-[7rem] cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed px-4 py-5 text-center transition",
          "peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-500",
          dragging
            ? "border-brand-500 bg-brand-50 dark:bg-brand-950/60"
            : "border-slate-300 bg-white hover:border-brand-400 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700/40",
          pending && "pointer-events-none opacity-60"
        )}
      >
        <Icon name="upload" className="h-6 w-6 text-brand-600 dark:text-brand-400" />
        <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
          {file ? "Choose a different file" : "Choose a file"}
          <span className="font-normal text-muted"> or drag it here</span>
        </span>
        <span id="nordea-file-hint" className="text-xs text-muted">
          CSV or TXT export from Nordea Netbank
        </span>
      </label>

      {file && (
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-700 dark:text-slate-200" role="status">
          <Icon name="clipboard" className="h-4 w-4 shrink-0 text-muted" />
          <span className="min-w-0 break-all">
            <span className="sr-only">Selected file: </span>
            <span className="font-medium">{file.name}</span>
            <span className="text-muted"> · {formatFileSize(file.size)}</span>
          </span>
          {!pending && (
            <button type="button" onClick={clear} className="link text-sm">
              Remove
            </button>
          )}
        </p>
      )}

      <button type="submit" className="btn-primary touch-target w-full sm:w-auto" disabled={pending || !file}>
        {pending ? (
          <>
            <Spinner />
            Importing…
          </>
        ) : (
          "Import"
        )}
      </button>

      {error && (
        <p role="alert" className="field-error text-sm">
          {error}
        </p>
      )}
    </form>
  );
}

function ImportSummary({ result, onDismiss }: { result: ImportBudgetResult; onDismiss: () => void }) {
  const nothingNew = result.imported === 0;
  const spansMonths = result.dateFrom && result.dateTo && result.dateFrom.slice(0, 7) !== result.dateTo.slice(0, 7);
  return (
    <section
      role="status"
      aria-labelledby="import-summary-title"
      className="card border-green-200 bg-green-50/60 dark:border-green-900 dark:bg-green-950/30"
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h2 id="import-summary-title" className="flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100">
            <Icon name={nothingNew ? "info" : "check"} className="h-5 w-5 shrink-0 text-green-700 dark:text-green-400" />
            {nothingNew ? "Nothing new to import" : "Import complete"}
          </h2>
          <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">
            Imported {result.imported} · {result.skippedDuplicates}{" "}
            {result.skippedDuplicates === 1 ? "duplicate" : "duplicates"} skipped · {result.autoCategorized}{" "}
            auto-categorized
          </p>
          {result.dateFrom && result.dateTo && (
            <p className="mt-0.5 text-xs text-muted">File covers {formatRange(`${result.dateFrom}T00:00:00`, `${result.dateTo}T00:00:00`)}</p>
          )}
        </div>
        <IconButton icon="x" aria-label="Dismiss import summary" onClick={onDismiss} className="-mr-2 -mt-2" />
      </div>
      {(result.uncategorized > 0 || result.monthKey) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {result.uncategorized > 0 && (
            <Link href="/dashboard/budget?view=uncategorized" className="btn-primary touch-target">
              Categorize {result.uncategorized} {result.uncategorized === 1 ? "transaction" : "transactions"}
              <Icon name="arrowRight" className="h-4 w-4" />
            </Link>
          )}
          {result.monthKey && (
            <Link href={`/dashboard/budget?month=${result.monthKey}`} className="btn-ghost touch-target">
              View {periodLabel("monthly", result.monthKey)}
              {spansMonths ? " (latest month)" : ""}
            </Link>
          )}
        </div>
      )}
    </section>
  );
}
