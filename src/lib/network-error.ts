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
}: {
  hidden: boolean;
  online: boolean;
}): boolean {
  return !hidden && online;
}
