'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { clsx } from 'clsx';

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
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-lg border border-zinc-200 bg-white shadow-lg">
          <div className="border-b border-zinc-100 px-4 py-2 text-sm font-medium text-zinc-700">
            Upcoming
          </div>
          {notifications.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-zinc-400">
              No upcoming alerts
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              {notifications.map((n) => (
                <div
                  key={n.bookingId}
                  className={clsx(
                    'border-b border-zinc-50 px-4 py-3 text-sm last:border-0',
                  )}
                >
                  <div className="font-medium text-zinc-800">{n.roomName}</div>
                  <div className="text-zinc-500">
                    Starts in {n.minutesUntilStart} min at{' '}
                    {new Date(n.startTime).toLocaleTimeString('en-GB', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
