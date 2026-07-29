'use client';

import { useEffect, useRef } from 'react';
import { CalendarClock, User } from 'lucide-react';

interface BookingData {
  id: string;
  startTime: string;
  endTime: string;
  userId: string;
  roomId: string;
  room: { id: string; name: string };
  user: { id: string; name: string };
}

interface BookingPopoverProps {
  booking: BookingData;
  onClose: () => void;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function BookingPopover({ booking, onClose }: BookingPopoverProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute z-30 w-64 rounded-lg border border-zinc-200 bg-white p-4 shadow-lg"
      style={{ bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 8 }}
    >
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-zinc-700">
          <User size={16} className="text-zinc-400 shrink-0" />
          <span className="font-medium">{booking.user.name}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-zinc-600">
          <CalendarClock size={16} className="text-zinc-400 shrink-0" />
          <span>
            {formatDate(booking.startTime)}, {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
          </span>
        </div>
        <div className="pt-2 border-t border-zinc-100">
          <p className="text-xs text-zinc-400 text-center">This slot is taken</p>
        </div>
      </div>
    </div>
  );
}
