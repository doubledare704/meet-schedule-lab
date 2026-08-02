const DEFAULT_NOTIFY_BEFORE_MINUTES = 10;

export function getNotifyBeforeMinutes(): number {
  const raw = process.env.NOTIFY_BEFORE_MINUTES;
  if (!raw) return DEFAULT_NOTIFY_BEFORE_MINUTES;

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return DEFAULT_NOTIFY_BEFORE_MINUTES;
  }

  return parsed;
}
