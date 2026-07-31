'use client';

import { clsx } from 'clsx';
import { Icon } from '@/components/ui/Icon';
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
  children?: React.ReactNode;
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
  children,
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
  const isShort = durationMin <= 30;
  const isOwn = booking.user.id === currentUserId;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick(booking)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(booking);
        }
      }}
      className={clsx(
        'pointer-events-auto absolute left-0.5 right-0.5 z-10 flex cursor-pointer text-left text-label-sm leading-tight shadow-sm transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary',
        isShort ? 'flex-row items-center justify-between px-2 py-0.5 text-[11px]' : 'flex-col justify-between overflow-visible rounded-lg px-2 py-1.5',
        isOwn
          ? 'bg-primary text-on-primary shadow-md'
          : 'border border-outline bg-surface-container text-on-surface',
      )}
      style={{
        top: `${topPct}%`,
        height: `${Math.max(heightPct, 4)}%`,
        borderLeft: isAllRooms ? `3px solid ${roomColor}` : undefined,
      }}
    >
      {isShort ? (
        <>
          <span className="truncate font-bold">
            {isAllRooms ? booking.room.name : isOwn ? 'Reserved' : booking.user.name}
          </span>
          <span className="ml-1 shrink-0 text-[10px] opacity-90">
            {formatTime(booking.startTime)}-{formatTime(booking.endTime)}
          </span>
        </>
      ) : (
        <>
          <div>
            <span className="block truncate font-bold">
              {isAllRooms ? booking.room.name : isOwn ? 'Reserved' : booking.user.name}
            </span>
          </div>
          <div className="flex items-center gap-0.5">
            <Icon name="schedule" size={12} />
            <span className="truncate">
              {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
            </span>
            {isAllRooms && !isOwn && (
              <span className="ml-auto truncate opacity-80">{booking.user.name}</span>
            )}
          </div>
        </>
      )}
      {children}
    </div>
  );
}
