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

/**
 * Stable fingerprint for import dedupe. `occurrence` distinguishes identical
 * rows within one file (0 = first, which keeps the legacy fingerprint).
 */
export function importFingerprint(
  date: Date,
  amountCents: number,
  description: string,
  occurrence = 0
): string {
  const day = toDateInputValue(date);
  const desc = normalizeMerchantKey(description);
  const base = `${day}|${amountCents}|${desc}`;
  const payload = occurrence > 0 ? `${base}|#${occurrence}` : base;
  return createHash("sha256").update(payload).digest("hex").slice(0, 32);
}

export function merchantKeyFromParts(payee: string, message?: string): string {
  const primary = payee.trim() || (message ?? "").trim() || "UNKNOWN";
  return normalizeMerchantKey(primary);
}
