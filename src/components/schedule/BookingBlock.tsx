'use client';

import { clsx } from 'clsx';
import { Icon } from '@/components/ui/Icon';
import {
  getDayStart,
  getOfficeWindow,
  getWallClockTime,
  officeRowIndexForLocalMinute,
} from '@/utils/timezone';

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
  displayTz: string;
  leftPct?: number;
  widthPct?: number;
  onClick: (booking: BookingData) => void;
  children?: React.ReactNode;
}

function formatTime(iso: string, displayTz: string): string {
  const d = new Date(iso);
  const wall = getWallClockTime(d, displayTz);
  return `${String(wall.hours).padStart(2, '0')}:${String(wall.minutes).padStart(2, '0')}`;
}

export function BookingBlock({
  booking,
  currentUserId,
  roomColor,
  isAllRooms,
  displayTz,
  leftPct,
  widthPct,
  onClick,
  children,
}: BookingBlockProps) {
  const start = new Date(booking.startTime);
  const end = new Date(booking.endTime);
  const rows = getOfficeWindow(getDayStart(start, displayTz), displayTz);

  const toRowIndex = (date: Date): number => {
    const wall = getWallClockTime(date, displayTz);
    return officeRowIndexForLocalMinute(wall.hours * 60 + wall.minutes, rows);
  };

  const startRow = Math.max(0, toRowIndex(start));
  const endRow = Math.max(startRow + 1, toRowIndex(end));
  const durationRows = endRow - startRow;
  const isShort = durationRows <= 1;
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
        'pointer-events-auto absolute z-10 flex cursor-pointer text-left text-label-sm leading-tight shadow-sm transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary',
        leftPct === undefined && 'left-0.5 right-0.5',
        isShort ? 'flex-row items-center justify-between px-2 py-0.5 text-[11px]' : 'flex-col justify-between overflow-visible rounded-lg px-2 py-1.5',
        isOwn
          ? 'bg-primary text-on-primary shadow-md'
          : 'border border-outline bg-surface-container text-on-surface',
      )}
      style={{
        top: `${(startRow / rows.length) * 100}%`,
        height: `${Math.max((durationRows / rows.length) * 100, 4)}%`,
        left: leftPct !== undefined ? `${leftPct}%` : undefined,
        width: widthPct !== undefined ? `${widthPct}%` : undefined,
        borderLeft: isAllRooms ? `3px solid ${roomColor}` : undefined,
      }}
    >
      {isShort ? (
        <>
          <span className="truncate font-bold">
            {isAllRooms ? booking.room.name : isOwn ? 'Reserved' : booking.user.name}
          </span>
          <span className="ml-1 shrink-0 text-[10px] opacity-90">
            {formatTime(booking.startTime, displayTz)}-{formatTime(booking.endTime, displayTz)}
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
              {formatTime(booking.startTime, displayTz)} - {formatTime(booking.endTime, displayTz)}
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
