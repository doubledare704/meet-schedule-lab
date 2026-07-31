let source: EventSource | null = null;

export function getNotificationSource(): EventSource | null {
  if (typeof window === 'undefined') return null;
  if (source) return source;

  source = new EventSource('/api/notifications/sse');
  source.onerror = () => {
    // EventSource auto-reconnects on transient failures. A non-2xx response
    // (e.g. 401 after session expiry) stops reconnection automatically.
  };

  return source;
}

export function closeNotificationSource(): void {
  source?.close();
  source = null;
}
