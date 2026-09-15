const NETWORK_ERROR_PATTERNS = [
  "failed to fetch",
  "networkerror",
  "network error",
  "load failed",
  "err_network_changed",
  "err_internet_disconnected",
  "err_connection_reset",
];

export function isNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return NETWORK_ERROR_PATTERNS.some((pattern) => message.includes(pattern));
}

export function shouldPollNotifications({
  hidden,
  online,
  inFlight = false,
}: {
  hidden: boolean;
  online: boolean;
  inFlight?: boolean;
}): boolean {
  return !hidden && online && !inFlight;
}

export type NotificationPollDecision = "apply" | "ignore" | "stop";

export function notificationPollDecision({
  error,
  status,
}: {
  error?: unknown;
  status?: number;
}): NotificationPollDecision {
  if (error != null) return "ignore";
  if (status === 401) return "stop";
  if (status === 200) return "apply";
  return "ignore";
}
