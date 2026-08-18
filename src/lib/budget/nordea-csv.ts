import { startOfDay } from "@/lib/date";
import { eurosToCents } from "@/lib/budget";
import { importFingerprint, merchantKeyFromParts } from "@/lib/budget/merchant";

export type ParsedNordeaTx = {
  date: Date;
  amountCents: number;
  type: "income" | "expense";
  rawDescription: string;
  merchantKey: string;
  fingerprint: string;
};

export type NordeaParseResult = {
  transactions: ParsedNordeaTx[];
  skippedRows: number;
};

export class NordeaParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NordeaParseError";
  }
}

const DATE_ALIASES = [
  "booking date",
  "book date",
  "kirjauspäivä",
  "kirjauspaiva",
  "value date",
  "arvopäivä",
  "arvopaiva",
  "payment date",
  "maksupäivä",
  "maksupaiva",
  "datum",
  "date",
];

const AMOUNT_ALIASES = ["amount", "määrä", "maara", "belopp", "summa"];

/** Prefer these for display / merchant identity (Nordea FI "Current Account" export). */
const NAME_ALIASES = ["name", "namn"];
const TITLE_ALIASES = ["title", "rubrik"];

const COUNTERPARTY_ALIASES = [
  "beneficiary/remitter",
  "saaja/maksaja",
  "recipient",
  "mottagare",
  "payee",
];

const SENDER_ALIASES = ["sender", "avsändare", "avsandare"];

const MESSAGE_ALIASES = ["message", "viesti", "meddelande", "memo", "description", "text"];

const EVENT_ALIASES = ["event type", "tapahtumatyyppi", "tapahtuma", "transaktion", "payment type"];

function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

function detectDelimiter(headerLine: string): string {
  const tabs = (headerLine.match(/\t/g) || []).length;
  const semis = (headerLine.match(/;/g) || []).length;
  const commas = (headerLine.match(/,/g) || []).length;
  if (tabs >= semis && tabs >= commas && tabs > 0) return "\t";
  if (semis >= commas && semis > 0) return ";";
  return ",";
}

function splitLine(line: string, delimiter: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === delimiter && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  cells.push(current.trim());
  return cells;
}

function normalizeHeader(h: string): string {
  return h
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function findColumn(headers: string[], aliases: string[]): number {
  for (const alias of aliases) {
    const idx = headers.findIndex((h) => h === alias);
    if (idx >= 0) return idx;
  }
  for (const alias of aliases) {
    const idx = headers.findIndex((h) => h.includes(alias));
    if (idx >= 0) return idx;
  }
  return -1;
}

function looksLikeHeader(cells: string[]): boolean {
  const joined = cells.map(normalizeHeader).join("|");
  const hasDate = DATE_ALIASES.some((a) => joined.includes(a));
  const hasAmount = AMOUNT_ALIASES.some((a) => joined.includes(a));
  return hasDate && hasAmount;
}

function looksLikeIbanOrAccount(value: string): boolean {
  const compact = value.replace(/\s+/g, "").toUpperCase();
  return /^[A-Z]{2}\d{2}/.test(compact) || /^\d{6,}$/.test(compact);
}

/** Pick merchant/payee label: Name → Title → non-IBAN counterparty → message. */
export function resolveNordeaLabel(parts: {
  name?: string;
  title?: string;
  recipient?: string;
  sender?: string;
  message?: string;
  eventType?: string;
}): string {
  const name = parts.name?.trim() ?? "";
  const title = parts.title?.trim() ?? "";
  if (name) return name;
  if (title) return title;

  for (const candidate of [parts.recipient, parts.sender, parts.eventType]) {
    const v = candidate?.trim() ?? "";
    if (v && !looksLikeIbanOrAccount(v)) return v;
  }

  const message = parts.message?.trim() ?? "";
  if (message) return message;
  return "";
}

export function parseNordeaAmount(raw: string): number | null {
  const cleaned = raw.trim().replace(/\s/g, "").replace(/€/g, "").replace(/EUR/gi, "");
  if (!cleaned || cleaned === "-" || cleaned === "+") return null;

  // Finnish: 1.234,56 or -12,50 ; also 1234.56
  let normalized = cleaned;
  if (normalized.includes(",") && normalized.includes(".")) {
    normalized = normalized.replace(/\./g, "").replace(",", ".");
  } else if (normalized.includes(",")) {
    normalized = normalized.replace(",", ".");
  }

  const value = Number(normalized);
  if (!Number.isFinite(value) || value === 0) return null;
  return eurosToCents(Math.abs(value)) * (value < 0 ? -1 : 1);
}

export function parseNordeaDate(raw: string): Date | null {
  const s = raw.trim();
  if (!s) return null;

  // YYYY-MM-DD or YYYY/MM/DD
  let m = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (m) {
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return Number.isNaN(d.getTime()) ? null : startOfDay(d);
  }

  // DD.MM.YYYY or DD/MM/YYYY
  m = s.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/);
  if (m) {
    const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
    return Number.isNaN(d.getTime()) ? null : startOfDay(d);
  }

  return null;
}

/**
 * Parse Nordea FI personal Netbank CSV/TSV export.
 * Skips preamble until a header row with date + amount columns is found.
 */
export function parseNordeaCsv(content: string): NordeaParseResult {
  const text = stripBom(content).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = text.split("\n");

  let headerIndex = -1;
  let delimiter = "\t";
  let headers: string[] = [];

  for (let i = 0; i < Math.min(lines.length, 30); i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const delim = detectDelimiter(line);
    const cells = splitLine(line, delim).map(normalizeHeader);
    if (looksLikeHeader(cells)) {
      headerIndex = i;
      delimiter = delim;
      headers = cells;
      break;
    }
  }

  if (headerIndex < 0) {
    throw new NordeaParseError(
      "Could not find a Nordea header row (need date and amount columns)."
    );
  }

  const dateIdx = findColumn(headers, DATE_ALIASES);
  const amountIdx = findColumn(headers, AMOUNT_ALIASES);
  const nameIdx = findColumn(headers, NAME_ALIASES);
  const titleIdx = findColumn(headers, TITLE_ALIASES);
  const recipientIdx = findColumn(headers, COUNTERPARTY_ALIASES);
  const senderIdx = findColumn(headers, SENDER_ALIASES);
  const messageIdx = findColumn(headers, MESSAGE_ALIASES);
  const eventIdx = findColumn(headers, EVENT_ALIASES);

  if (dateIdx < 0 || amountIdx < 0) {
    throw new NordeaParseError("Nordea file is missing required date or amount columns.");
  }

  const transactions: ParsedNordeaTx[] = [];
  let skippedRows = 0;

  for (let i = headerIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cells = splitLine(line, delimiter);
    const dateRaw = cells[dateIdx] ?? "";
    const amountRaw = cells[amountIdx] ?? "";
    const name = nameIdx >= 0 ? cells[nameIdx] ?? "" : "";
    const title = titleIdx >= 0 ? cells[titleIdx] ?? "" : "";
    const recipient = recipientIdx >= 0 ? cells[recipientIdx] ?? "" : "";
    const sender = senderIdx >= 0 ? cells[senderIdx] ?? "" : "";
    const message = messageIdx >= 0 ? cells[messageIdx] ?? "" : "";
    const eventType = eventIdx >= 0 ? cells[eventIdx] ?? "" : "";

    const label = resolveNordeaLabel({ name, title, recipient, sender, message, eventType });

    // Skip reserved/pending style rows
    const joined = `${label} ${message} ${eventType}`.toLowerCase();
    if (joined.includes("reserverat") || joined.includes("varattu")) {
      skippedRows++;
      continue;
    }

    const date = parseNordeaDate(dateRaw);
    const signedCents = parseNordeaAmount(amountRaw);
    if (!date || signedCents === null) {
      skippedRows++;
      continue;
    }

    const type: "income" | "expense" = signedCents > 0 ? "income" : "expense";
    const amountCents = Math.abs(signedCents);
    const rawDescription = label || "Nordea transaction";
    const merchantKey = merchantKeyFromParts(rawDescription);
    const fingerprint = importFingerprint(date, signedCents, rawDescription);

    transactions.push({
      date,
      amountCents,
      type,
      rawDescription,
      merchantKey,
      fingerprint,
    });
  }

  if (transactions.length === 0) {
    throw new NordeaParseError("No valid transactions found in the file.");
  }

  return { transactions, skippedRows };
}
