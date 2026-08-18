"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Spinner from "@/components/Spinner";
import { importNordeaFile } from "./actions";

type Props = {
  empty?: boolean;
};

export default function ImportUpload({ empty }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await importNordeaFile(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMessage(result.message);
      form.reset();
      if (inputRef.current) inputRef.current.value = "";
      router.refresh();
    });
  }

  return (
    <div className={`card ${empty ? "border-brand-200 bg-brand-50/40" : ""}`}>
      <h2 className="font-semibold text-slate-900">
        {empty ? "Import your first Nordea statement" : "Import Nordea CSV"}
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        From Nordea Netbank, download account transactions as CSV/TXT and upload here. Known
        merchants are categorized automatically.
      </p>
      <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <label className="label" htmlFor="nordea-file">
            File
          </label>
          <input
            ref={inputRef}
            id="nordea-file"
            name="file"
            type="file"
            accept=".csv,.txt,text/csv,text/plain"
            className="input"
            required
            disabled={pending}
          />
        </div>
        <button type="submit" className="btn-primary touch-target" disabled={pending}>
          {pending ? (
            <>
              <Spinner />
              Importing…
            </>
          ) : (
            "Import"
          )}
        </button>
      </form>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {message && <p className="mt-3 text-sm text-emerald-700">{message}</p>}
    </div>
  );
}
