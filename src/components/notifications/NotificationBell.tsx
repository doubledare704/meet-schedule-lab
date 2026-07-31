'use client';

import { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { Icon } from '@/components/ui/Icon';

interface ExpiringNotification {
  bookingId: string;
  roomName: string;
  startTime: string;
  minutesUntilStart: number;
}

interface NotificationBellProps {
  source: EventSource | null;
}

export function NotificationBell({ source }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<ExpiringNotification[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!source) return;

    function handleEvent(e: MessageEvent) {
      try {
        const data: ExpiringNotification = JSON.parse(e.data);
        setNotifications((prev) => {
          if (prev.some((n) => n.bookingId === data.bookingId)) return prev;
          return [...prev, data];
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

  useEffect(() => {
    function handleKeydown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    if (open) {
      document.addEventListener('keydown', handleKeydown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeydown);
      document.body.style.overflow = '';
    };
  }, [open]);

  const unreadCount = notifications.length;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className="relative rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-on-surface"
      >
        <Icon name="notifications" size={20} />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-error text-[10px] font-bold text-on-error">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <div
        className={clsx(
          'fixed inset-0 z-[60] bg-on-background/20 backdrop-blur-sm transition-opacity duration-300',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={() => setOpen(false)}
      />

      <aside
        className={clsx(
          'fixed inset-y-0 right-0 z-[70] flex w-[400px] max-w-[100vw] flex-col border-l border-outline-variant bg-surface-bright shadow-2xl transition-transform duration-300',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <div className="border-b border-outline-variant px-6 py-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-headline-md font-bold text-on-surface">Notifications</h3>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-2 transition-colors hover:bg-surface-container-low"
              aria-label="Close notifications"
            >
              <Icon name="close" size={20} />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-label-sm text-on-surface-variant">
              You have {unreadCount} unread alert{unreadCount !== 1 ? 's' : ''}
            </p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => setNotifications([])}
                className="text-label-sm font-bold text-primary hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>
        </div>

        <div className="custom-scrollbar flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="px-6 py-16 text-center text-body-md text-on-surface-variant">
              <Icon name="notifications_off" size={40} className="mb-4 text-outline" />
              <p>No upcoming alerts</p>
            </div>
          ) : (
            <div className="divide-y divide-outline-variant">
              {notifications.map((n, idx) => (
                <div
                  key={n.bookingId}
                  className={clsx(
                    'relative cursor-pointer p-6 transition-colors',
                    idx === 0 ? 'border-l-4 border-primary bg-primary-fixed/10' : 'hover:bg-surface-container-low',
                  )}
                >
                  <div className="flex gap-4">
                    <span className="mt-0.5">
                      <Icon name="timer" size={20} filled={idx === 0} className="text-primary" />
                    </span>
                    <div className="flex-1">
                      <h4 className="text-label-md font-bold text-on-surface">Slot Starting Soon</h4>
                      <p className="mt-1 text-body-sm leading-relaxed text-on-surface-variant">
                        Your booking in <strong className="text-on-surface">{n.roomName}</strong> starts
                        in {n.minutesUntilStart} min at{' '}
                        {new Date(n.startTime).toLocaleTimeString('en-GB', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        .
                      </p>
                    </div>
                  </div>
                  {idx === 0 && (
                    <span className="absolute right-4 top-4 h-2 w-2 rounded-full bg-primary" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-outline-variant bg-surface-container-low p-6">
          <button
            type="button"
            className="w-full py-2 text-center text-label-md text-on-surface-variant transition-colors hover:text-primary"
          >
            View Notification History
          </button>
        </div>
      </aside>
    </>
  );
}
