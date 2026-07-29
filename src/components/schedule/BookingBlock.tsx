'use client';

import { clsx } from 'clsx';
import { getWallClockTime } from '@/utils/timezone';

interface BookingData {
  id: string;
  startTime: string;
  endTime: string;
  userId: string;
  roomId: string;
  room: { id: string; name: string };
  user: { id: string; name: string };
}

interface BookingBlockProps {
  booking: BookingData;
  currentUserId: string;
  roomColor: string;
  isAllRooms: boolean;
  onClick: (booking: BookingData) => void;
}

const TZ = 'Europe/Kyiv';

function formatTime(iso: string): string {
  const d = new Date(iso);
  const wall = getWallClockTime(d, TZ);
  return `${String(wall.hours).padStart(2, '0')}:${String(wall.minutes).padStart(2, '0')}`;
}

export function BookingBlock({
  booking,
  currentUserId,
  roomColor,
  isAllRooms,
  onClick,
}: BookingBlockProps) {
  const start = new Date(booking.startTime);
  const end = new Date(booking.endTime);
  const startWall = getWallClockTime(start, TZ);
  const endWall = getWallClockTime(end, TZ);

  const startMin = startWall.hours * 60 + startWall.minutes;
  const endMin = endWall.hours * 60 + endWall.minutes;
  const durationMin = endMin - startMin;
  const dayStartMin = 540;

  const topPct = ((startMin - dayStartMin) / 600) * 100;
  const heightPct = (durationMin / 600) * 100;
  const isOwn = booking.user.id === currentUserId;

  return (
    <button
      type="button"
      onClick={() => onClick(booking)}
      className={clsx(
        'pointer-events-auto absolute left-0.5 right-0.5 z-10 flex cursor-pointer flex-col justify-start overflow-hidden rounded-md px-2 py-1 text-left text-xs leading-tight shadow-sm transition-opacity hover:opacity-90',
        isOwn ? 'bg-indigo-600 text-white' : 'bg-slate-400 text-white',
      )}
      style={{
        top: `${topPct}%`,
        height: `${Math.max(heightPct, 4)}%`,
        borderLeft: isAllRooms ? `3px solid ${roomColor}` : undefined,
      }}
    >
      {isAllRooms && (
        <span className="font-medium">{booking.room.name}</span>
      )}
      <span>
        {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
      </span>
      {!isOwn && <span className="opacity-80">{booking.user.name}</span>}
    </button>
  );
}
