import { createHash } from "crypto";
import { toDateInputValue } from "@/lib/date";

/** Normalize merchant/payee text for category rules. */
export function normalizeMerchantKey(raw: string): string {
  return raw
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

/** Stable fingerprint for import dedupe. */
export function importFingerprint(
  date: Date,
  amountCents: number,
  description: string
): string {
  const day = toDateInputValue(date);
  const desc = normalizeMerchantKey(description);
  const payload = `${day}|${amountCents}|${desc}`;
  return createHash("sha256").update(payload).digest("hex").slice(0, 32);
}

export function merchantKeyFromParts(payee: string, message?: string): string {
  const primary = payee.trim() || (message ?? "").trim() || "UNKNOWN";
  return normalizeMerchantKey(primary);
}
