'use client';

import { useEffect, useRef } from 'react';
import { Icon } from '@/components/ui/Icon';

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
      className="absolute z-30 w-64 rounded-lg border border-outline-variant bg-surface p-4 shadow-lg"
      style={{ bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 8 }}
    >
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-body-sm text-on-surface">
          <Icon name="person" size={16} className="shrink-0 text-outline" />
          <span className="font-medium">{booking.user.name}</span>
        </div>
        <div className="flex items-center gap-2 text-body-sm text-on-surface-variant">
          <Icon name="calendar_clock" size={16} className="shrink-0 text-outline" />
          <span>
            {formatDate(booking.startTime)}, {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
          </span>
        </div>
        <div className="border-t border-outline-variant pt-2">
          <p className="text-center text-label-sm text-on-surface-variant">This slot is taken</p>
        </div>
      </div>
    </div>
  );
}
