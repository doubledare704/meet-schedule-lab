'use client';

import { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { Icon } from '@/components/ui/Icon';

interface Toast {
  id: string;
  roomName: string;
  minutesUntilStart: number;
  startTime: string;
}

interface NotificationToastProps {
  source: EventSource | null;
}

export function NotificationToast({ source }: NotificationToastProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    if (!source) return;

    function handleEvent(e: MessageEvent) {
      try {
        const data = JSON.parse(e.data);
        setToasts((prev) => {
          if (prev.some((t) => t.id === data.bookingId)) return prev;
          return [
            ...prev,
            {
              id: data.bookingId,
              roomName: data.roomName,
              minutesUntilStart: data.minutesUntilStart,
              startTime: data.startTime,
            },
          ];
        });
      } catch {
        // Ignore parse errors
      }
    }

    source.addEventListener('booking-expiring', handleEvent);

    return () => {
      source.removeEventListener('booking-expiring', handleEvent);
    };
  }, [source]);

  function dismiss(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[80] flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={clsx(
            'flex items-start gap-3 rounded-lg border border-outline-variant bg-surface px-4 py-3 shadow-lg animate-slide-up',
          )}
        >
          <span className="mt-0.5">
            <Icon name="timer" size={20} className="text-primary" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-label-md font-medium text-on-surface">{toast.roomName}</p>
            <p className="text-body-sm text-on-surface-variant">
              Starts in {toast.minutesUntilStart} min at{' '}
              {new Date(toast.startTime).toLocaleTimeString('en-GB', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
          <button
            type="button"
            onClick={() => dismiss(toast.id)}
            className="shrink-0 rounded p-0.5 text-on-surface-variant transition-colors hover:text-on-surface"
            aria-label="Dismiss"
          >
            <Icon name="close" size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
