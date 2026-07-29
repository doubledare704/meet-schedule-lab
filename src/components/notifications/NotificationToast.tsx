'use client';

import { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { X } from 'lucide-react';

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
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={clsx(
            'flex items-start gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3 shadow-lg',
            'animate-slide-up',
          )}
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-zinc-900">{toast.roomName}</p>
            <p className="text-xs text-zinc-500">
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
            className="shrink-0 rounded p-0.5 text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
