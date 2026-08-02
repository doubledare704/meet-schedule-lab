export interface ExpiringNotification {
  bookingId: string;
  roomName: string;
  startTime: string;
  minutesUntilStart: number;
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
 * Parses an SSE `data:` payload into an ExpiringNotification, tolerating
 * trailing whitespace, embedded newlines, or concatenated event payloads.
 * Returns null when the payload is missing or malformed.
 */
export function parseExpiringNotification(
  rawData: string,
): ExpiringNotification | null {
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
    typeof candidate.bookingId !== 'string' ||
    typeof candidate.roomName !== 'string' ||
    typeof candidate.startTime !== 'string' ||
    typeof candidate.minutesUntilStart !== 'number'
  ) {
    return null;
  }

  return {
    bookingId: candidate.bookingId,
    roomName: candidate.roomName,
    startTime: candidate.startTime,
    minutesUntilStart: candidate.minutesUntilStart,
  };
}
