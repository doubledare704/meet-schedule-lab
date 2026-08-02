import type { NotificationType } from '@prisma/client';

const NOTIFICATION_TYPES: readonly NotificationType[] = [
  'SLOT_ENDING_SOON',
  'SLOT_STARTING_SOON',
  'BOOKING_CANCELLED',
];

export interface NotificationEvent {
  id: string;
  bookingId: string | null;
  type: NotificationType;
  message: string;
  createdAt: string;
}

/**
 * Extracts the first complete JSON object from a string that may contain
 * trailing content or concatenated payloads (e.g. coalesced SSE data lines).
 */
export function extractFirstJsonObject(text: string): string | null {
  const start = text.indexOf('{');
  if (start < 0) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
    } else if (ch === '"') {
      inString = true;
    } else if (ch === '{') {
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0) {
        return text.slice(start, i + 1);
      }
    }
  }

  return null;
}

/**
 * Parses an SSE `data:` payload into a NotificationEvent, tolerating trailing
 * whitespace, embedded newlines, or concatenated event payloads.
 * Returns null when the payload is missing or malformed.
 */
export function parseNotification(rawData: string): NotificationEvent | null {
  const jsonText = extractFirstJsonObject(rawData);
  if (!jsonText) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return null;
  }

  if (typeof parsed !== 'object' || parsed === null) return null;
  const candidate = parsed as Record<string, unknown>;

  if (
    typeof candidate.id !== 'string' ||
    (typeof candidate.bookingId !== 'string' && candidate.bookingId !== null) ||
    typeof candidate.type !== 'string' ||
    typeof candidate.message !== 'string' ||
    typeof candidate.createdAt !== 'string'
  ) {
    return null;
  }

  if (!NOTIFICATION_TYPES.includes(candidate.type as NotificationType)) {
    return null;
  }

  return {
    id: candidate.id,
    bookingId: candidate.bookingId,
    type: candidate.type as NotificationType,
    message: candidate.message,
    createdAt: candidate.createdAt,
  };
}
