"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useFormState } from "react-dom";
import { addDays, toDateInputValue } from "@/lib/date";
import { relationshipLabel } from "@/lib/contacts";
import {
  INTERACTION_TYPES,
  INTERACTION_TYPE_LABELS,
  serializeTopics,
} from "@/lib/networking";
import SubmitButton from "@/components/SubmitButton";
import { useToast } from "@/components/Toast";
import type { FormAction } from "@/lib/action-result";
import type { ComposerContact } from "@/lib/queries/networking";

type DateChip = "today" | "yesterday" | "custom";

type Props = {
  contacts: ComposerContact[];
  suggestedTopics: string[];
  action: FormAction;
  lockedContact?: ComposerContact;
};

export default function LogComposer({ contacts, suggestedTopics, action, lockedContact }: Props) {
  const { success, error } = useToast();
  const [state, formAction] = useFormState(action, null);
  const [, startTransition] = useTransition();
  const listRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState(lockedContact?.name ?? "");
  const [selectedId, setSelectedId] = useState(lockedContact?.id ?? "");
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("call");
  const [dateChip, setDateChip] = useState<DateChip>("today");
  const [customDate, setCustomDate] = useState(toDateInputValue(new Date()));
  const [topics, setTopics] = useState<string[]>([]);
  const [topicDraft, setTopicDraft] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      success(state.message ?? "Logged");
      if (!lockedContact) {
        setQuery("");
        setSelectedId("");
      }
      setTopics([]);
      setTopicDraft("");
      setNote("");
      setDateChip("today");
      setType("call");
    } else {
      error(state.error);
    }
  }, [state, success, error, lockedContact]);

  const dateValue =
    dateChip === "today"
      ? toDateInputValue(new Date())
      : dateChip === "yesterday"
        ? toDateInputValue(addDays(new Date(), -1))
        : customDate;

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return contacts.slice(0, 8);
    return contacts.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 8);
  }, [contacts, query]);

  const exactMatch = contacts.find((c) => c.name.toLowerCase() === query.trim().toLowerCase());
  const createName = !lockedContact && query.trim() && !selectedId && !exactMatch ? query.trim() : "";
  const resolvedId = selectedId || exactMatch?.id || "";

  function selectContact(contact: ComposerContact) {
    setSelectedId(contact.id);
    setQuery(contact.name);
    setOpen(false);
  }

  function addTopic(raw: string) {
    const topic = raw.trim();
    if (!topic) return;
    if (topics.some((t) => t.toLowerCase() === topic.toLowerCase())) {
      setTopicDraft("");
      return;
    }
    setTopics((prev) => [...prev, topic]);
    setTopicDraft("");
  }

  function onTopicKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTopic(topicDraft.replace(/,/g, ""));
    } else if (e.key === "Backspace" && !topicDraft && topics.length > 0) {
      setTopics((prev) => prev.slice(0, -1));
    }
  }

  const unusedSuggestions = suggestedTopics.filter(
    (t) => !topics.some((x) => x.toLowerCase() === t.toLowerCase())
  );

  return (
    <form
      action={(fd) => startTransition(() => formAction(fd))}
      className="card mb-6 space-y-4"
      onSubmit={() => setOpen(false)}
    >
      <input type="hidden" name="contactId" value={resolvedId} />
      <input type="hidden" name="name" value={createName} />
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="date" value={dateValue} />
      <input type="hidden" name="topics" value={serializeTopics(topics) ?? ""} />

      {!lockedContact && (
        <div className="relative">
          <label className="label" htmlFor="networking-person">
            Person
          </label>
          <input
            id="networking-person"
            className="input"
            placeholder="Who did you talk to?"
            autoComplete="off"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedId("");
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => {
              window.setTimeout(() => {
                if (!listRef.current?.contains(document.activeElement)) setOpen(false);
              }, 120);
            }}
          />
          {open && (
            <div
              ref={listRef}
              className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-md border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-600 dark:bg-slate-800"
            >
              {matches.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectContact(c)}
                >
                  <span className="font-medium text-slate-800 dark:text-slate-100">{c.name}</span>
                  {relationshipLabel(c.relationship) && (
                    <span className="text-xs text-slate-400">{relationshipLabel(c.relationship)}</span>
                  )}
                </button>
              ))}
              {createName && (
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm font-medium text-brand-700 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-slate-700"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setSelectedId("");
                    setOpen(false);
                  }}
                >
                  Create “{createName}” and log
                </button>
              )}
              {matches.length === 0 && !createName && (
                <p className="px-3 py-2 text-sm text-slate-400">No people yet — type a name to add one.</p>
              )}
            </div>
          )}
        </div>
      )}

      <div>
        <p className="label">Type</p>
        <div className="flex flex-wrap gap-2">
          {INTERACTION_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                type === t
                  ? "bg-brand-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200"
              }`}
            >
              {INTERACTION_TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="label">When</p>
        <div className="flex flex-wrap items-center gap-2">
          {(["today", "yesterday"] as const).map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => setDateChip(chip)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium capitalize transition ${
                dateChip === chip
                  ? "bg-brand-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200"
              }`}
            >
              {chip}
            </button>
          ))}
          <input
            type="date"
            className="input w-auto"
            value={dateChip === "custom" ? customDate : dateValue}
            onChange={(e) => {
              setDateChip("custom");
              setCustomDate(e.target.value);
            }}
          />
        </div>
      </div>

      <div>
        <p className="label">Topics</p>
        <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2 py-1.5 dark:border-slate-600 dark:bg-slate-800">
          {topics.map((topic) => (
            <span key={topic} className="badge bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
              {topic}
              <button
                type="button"
                className="ml-1 text-brand-500 hover:text-brand-800"
                aria-label={`Remove ${topic}`}
                onClick={() => setTopics((prev) => prev.filter((t) => t !== topic))}
              >
                ×
              </button>
            </span>
          ))}
          <input
            className="min-w-[8rem] flex-1 border-0 bg-transparent px-1 py-1 text-sm outline-none"
            placeholder={topics.length === 0 ? "health, kids, work…" : "Add topic"}
            value={topicDraft}
            onChange={(e) => setTopicDraft(e.target.value)}
            onKeyDown={onTopicKeyDown}
            onBlur={() => addTopic(topicDraft)}
          />
        </div>
        {unusedSuggestions.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {unusedSuggestions.slice(0, 8).map((topic) => (
              <button
                key={topic}
                type="button"
                className="badge bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300"
                onClick={() => addTopic(topic)}
              >
                + {topic}
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="label" htmlFor="networking-note">
          Note
        </label>
        <input
          id="networking-note"
          name="summary"
          className="input"
          placeholder="What did you talk about? (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      <SubmitButton className="btn-primary">Log</SubmitButton>
    </form>
  );
}
