"use client";

import { useEffect, useId, useMemo, useState, useTransition } from "react";
import { useFormState } from "react-dom";
import clsx from "clsx";
import { addDays, toDateInputValue } from "@/lib/date";
import { RELATIONSHIPS, RELATIONSHIP_LABELS, relationshipLabel } from "@/lib/contacts";
import {
  INTERACTION_TYPES,
  INTERACTION_TYPE_LABELS,
  serializeTopics,
} from "@/lib/networking";
import SubmitButton from "@/components/SubmitButton";
import IconButton from "@/components/IconButton";
import { useToast } from "@/components/Toast";
import type { FormAction } from "@/lib/action-result";
import type { ComposerContact } from "@/lib/queries/networking";

type DateChip = "today" | "yesterday" | "custom";

type Props = {
  contacts: ComposerContact[];
  suggestedTopics: string[];
  action: FormAction;
  lockedContact?: ComposerContact;
  /** Preselect a person (e.g. `?person=` after "Add person"). */
  initialContactId?: string;
};

type Option = { kind: "contact"; contact: ComposerContact } | { kind: "create"; name: string };

export default function LogComposer({ contacts, suggestedTopics, action, lockedContact, initialContactId }: Props) {
  const { success, error } = useToast();
  const [state, formAction] = useFormState(action, null);
  const [, startTransition] = useTransition();
  const uid = useId();
  const listboxId = `${uid}-people`;
  const personHintId = `${uid}-person-hint`;
  const optionId = (i: number) => `${uid}-opt-${i}`;

  const initialContact = lockedContact ?? contacts.find((c) => c.id === initialContactId);
  const [query, setQuery] = useState(initialContact?.name ?? "");
  const [selectedId, setSelectedId] = useState(initialContact?.id ?? "");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [newRelationship, setNewRelationship] = useState("other");
  const [type, setType] = useState("call");
  const [dateChip, setDateChip] = useState<DateChip>("today");
  const [customDate, setCustomDate] = useState(toDateInputValue(new Date()));
  const [topics, setTopics] = useState<string[]>([]);
  const [topicDraft, setTopicDraft] = useState("");
  const [note, setNote] = useState("");

  // `?person=` may change while the composer stays mounted (toast action).
  useEffect(() => {
    if (lockedContact || !initialContactId) return;
    const c = contacts.find((x) => x.id === initialContactId);
    if (c) {
      setSelectedId(c.id);
      setQuery(c.name);
    }
  }, [initialContactId, contacts, lockedContact]);

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      success(state.message ?? "Logged");
      if (!lockedContact) {
        setQuery("");
        setSelectedId("");
        setNewRelationship("other");
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
  const hasPerson = Boolean(lockedContact || resolvedId || createName);

  const options: Option[] = [
    ...matches.map((contact) => ({ kind: "contact" as const, contact })),
    ...(createName ? [{ kind: "create" as const, name: createName }] : []),
  ];

  function selectContact(contact: ComposerContact) {
    setSelectedId(contact.id);
    setQuery(contact.name);
    setOpen(false);
    setActiveIndex(-1);
  }

  function chooseOption(opt: Option) {
    if (opt.kind === "contact") {
      selectContact(opt.contact);
    } else {
      // Keep the typed name; it will be created when the log is saved.
      setSelectedId("");
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  function onPersonKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) setOpen(true);
      setActiveIndex((i) => (options.length === 0 ? -1 : (i + 1) % options.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) setOpen(true);
      setActiveIndex((i) => (options.length === 0 ? -1 : i <= 0 ? options.length - 1 : i - 1));
    } else if (e.key === "Enter") {
      if (open && activeIndex >= 0 && options[activeIndex]) {
        e.preventDefault();
        chooseOption(options[activeIndex]);
      }
    } else if (e.key === "Escape") {
      if (open) {
        e.preventDefault();
        setOpen(false);
        setActiveIndex(-1);
      }
    }
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

  const showList = open && !lockedContact;

  return (
    <form
      action={(fd) => startTransition(() => formAction(fd))}
      className="card mb-6 space-y-5"
      onSubmit={() => setOpen(false)}
      aria-label={lockedContact ? `Log an interaction with ${lockedContact.name}` : "Log an interaction"}
    >
      <input type="hidden" name="contactId" value={resolvedId} />
      <input type="hidden" name="name" value={createName} />
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="date" value={dateValue} />
      <input type="hidden" name="topics" value={serializeTopics(topics) ?? ""} />

      {!lockedContact && (
        <div className="relative">
          <label className="label" htmlFor={`${uid}-person`}>
            Person
          </label>
          <input
            id={`${uid}-person`}
            role="combobox"
            aria-expanded={showList}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={showList && activeIndex >= 0 ? optionId(activeIndex) : undefined}
            aria-describedby={personHintId}
            className="input"
            placeholder="Who did you talk to?"
            autoComplete="off"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedId("");
              setOpen(true);
              setActiveIndex(-1);
            }}
            onKeyDown={onPersonKeyDown}
            onFocus={() => setOpen(true)}
            onBlur={() => {
              setOpen(false);
              setActiveIndex(-1);
            }}
          />
          <ul
            id={listboxId}
            role="listbox"
            aria-label="People"
            hidden={!showList}
            className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-md border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-600 dark:bg-slate-800"
          >
            {options.map((opt, i) => {
              const active = i === activeIndex;
              if (opt.kind === "create") {
                return (
                  <li
                    key="__create"
                    id={optionId(i)}
                    role="option"
                    aria-selected={active}
                    className={clsx(
                      "cursor-pointer border-t border-slate-100 px-3 py-2.5 text-sm font-medium text-brand-700 dark:border-slate-700 dark:text-brand-400",
                      active ? "bg-brand-50 dark:bg-slate-700" : "hover:bg-brand-50 dark:hover:bg-slate-700"
                    )}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => chooseOption(opt)}
                  >
                    + New person “{opt.name}”
                  </li>
                );
              }
              const rel = relationshipLabel(opt.contact.relationship);
              return (
                <li
                  key={opt.contact.id}
                  id={optionId(i)}
                  role="option"
                  aria-selected={active}
                  className={clsx(
                    "flex cursor-pointer items-center justify-between gap-2 px-3 py-2.5 text-sm",
                    active ? "bg-slate-100 dark:bg-slate-700" : "hover:bg-slate-50 dark:hover:bg-slate-700"
                  )}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => chooseOption(opt)}
                >
                  <span className="font-medium text-slate-800 dark:text-slate-100">{opt.contact.name}</span>
                  {rel && <span className="text-xs text-muted">{rel}</span>}
                </li>
              );
            })}
            {options.length === 0 && (
              <li role="presentation" className="px-3 py-2 text-sm text-muted">
                No people yet — type a name to add one.
              </li>
            )}
          </ul>
          <p id={personHintId} className="hint" aria-live="polite">
            {createName ? `“${createName}” will be added as a new person when you log.` : null}
          </p>
          {createName && (
            <div className="mt-3 max-w-xs">
              <label className="label" htmlFor={`${uid}-relationship`}>
                Relationship for {createName}
              </label>
              <select
                id={`${uid}-relationship`}
                name="relationship"
                className="input"
                value={newRelationship}
                onChange={(e) => setNewRelationship(e.target.value)}
              >
                {RELATIONSHIPS.map((r) => (
                  <option key={r} value={r}>
                    {RELATIONSHIP_LABELS[r]}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      <fieldset>
        <legend className="label">Type</legend>
        <div className="flex flex-wrap gap-2">
          {INTERACTION_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={type === t}
              onClick={() => setType(t)}
              className={clsx("chip", type === t ? "chip-active" : "chip-idle")}
            >
              {INTERACTION_TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="label">When</legend>
        <div className="flex flex-wrap items-center gap-2">
          {(["today", "yesterday"] as const).map((chip) => (
            <button
              key={chip}
              type="button"
              aria-pressed={dateChip === chip}
              onClick={() => setDateChip(chip)}
              className={clsx("chip capitalize", dateChip === chip ? "chip-active" : "chip-idle")}
            >
              {chip}
            </button>
          ))}
          <label htmlFor={`${uid}-date`} className="sr-only">
            Date
          </label>
          <input
            id={`${uid}-date`}
            type="date"
            className="input w-full sm:w-auto"
            value={dateChip === "custom" ? customDate : dateValue}
            onChange={(e) => {
              setDateChip("custom");
              setCustomDate(e.target.value);
            }}
          />
        </div>
      </fieldset>

      <div>
        <label className="label" htmlFor={`${uid}-topic`}>
          Topics <span className="font-normal text-muted">(optional)</span>
        </label>
        <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2 py-1 shadow-sm focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100 dark:border-slate-600 dark:bg-slate-800 dark:focus-within:ring-brand-700/30">
          {topics.map((topic) => (
            <span key={topic} className="badge-brand py-0 pr-0">
              {topic}
              <IconButton
                icon="x"
                aria-label={`Remove topic ${topic}`}
                className="h-7 w-7 text-brand-700 dark:text-brand-300"
                iconClassName="h-3.5 w-3.5"
                onClick={() => setTopics((prev) => prev.filter((t) => t !== topic))}
              />
            </span>
          ))}
          <input
            id={`${uid}-topic`}
            className="min-w-[8rem] flex-1 border-0 bg-transparent px-1 py-1.5 text-sm text-slate-800 outline-none focus-visible:outline-none dark:text-slate-100"
            placeholder={topics.length === 0 ? "health, kids, work…" : "Add topic"}
            value={topicDraft}
            onChange={(e) => setTopicDraft(e.target.value)}
            onKeyDown={onTopicKeyDown}
            onBlur={() => addTopic(topicDraft)}
            aria-describedby={`${uid}-topic-hint`}
          />
        </div>
        <p id={`${uid}-topic-hint`} className="hint">
          Press Enter or comma to add a topic.
        </p>
        {unusedSuggestions.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Suggested topics">
            {unusedSuggestions.slice(0, 8).map((topic) => (
              <button
                key={topic}
                type="button"
                className="chip chip-idle min-h-[32px] px-2.5 text-xs"
                onClick={() => addTopic(topic)}
                aria-label={`Add topic ${topic}`}
              >
                + {topic}
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="label" htmlFor={`${uid}-note`}>
          Note <span className="font-normal text-muted">(optional)</span>
        </label>
        <textarea
          id={`${uid}-note`}
          name="summary"
          className="input"
          rows={2}
          placeholder="What did you talk about?"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton
          className="btn-primary"
          disabled={!hasPerson}
          aria-describedby={!hasPerson ? `${uid}-submit-hint` : undefined}
        >
          {createName ? `Add ${createName} & log` : "Log"}
        </SubmitButton>
        {!hasPerson && (
          <span id={`${uid}-submit-hint`} className="text-sm text-muted">
            Pick someone, or type a new name.
          </span>
        )}
      </div>
    </form>
  );
}
