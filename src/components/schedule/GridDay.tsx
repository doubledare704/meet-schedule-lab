'use client';

import { clsx } from 'clsx';
import { Icon } from '@/components/ui/Icon';
import {
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

interface DayInfo {
  date: Date;
  year: number;
  month: number;
  day: number;
  weekday: number;
}

interface GridDayProps {
  day: DayInfo;
  bookings: BookingData[];
  currentUserId: string;
  isAllRooms: boolean;
  isToday: boolean;
  currentTimePos: number | null;
  displayTz: string;
  onSlotClick: (day: DayInfo, localMinute: number) => void;
  onBookingClick: (booking: BookingData) => void;
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function GridDay({
  day,
  bookings,
  currentUserId,
  isAllRooms,
  isToday,
  displayTz,
  onSlotClick,
  onBookingClick,
}: GridDayProps) {
  const rows = getOfficeWindow(day.date, displayTz);

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-label-md text-on-surface-variant">
          {day.day} {WEEKDAY_LABELS[day.weekday]}
        </span>
        {isToday && (
          <span className="text-label-md font-medium text-error">Now</span>
        )}
      </div>
      <div className="mt-2 overflow-hidden rounded-xl border border-outline-variant bg-surface">
        {rows.map((row, rowIdx) => {
          const cellBookings = bookings.filter((b) => {
            const bStart = getWallClockTime(new Date(b.startTime), displayTz);
            const bEnd = getWallClockTime(new Date(b.endTime), displayTz);
            const bStartRow = officeRowIndexForLocalMinute(bStart.hours * 60 + bStart.minutes, rows);
            const bEndRow = officeRowIndexForLocalMinute(bEnd.hours * 60 + bEnd.minutes, rows);
            const startRow = bStartRow < 0 ? 0 : bStartRow;
            const endRow = bEndRow < 0 ? rows.length : bEndRow;
            return startRow < endRow && startRow <= rowIdx && rowIdx < endRow;
          });

          const hasBooking = cellBookings.length > 0;

          return (
            <div
              key={rowIdx}
              className={clsx(
                'flex min-h-[48px] items-center border-b border-outline-variant last:border-0',
                hasBooking ? 'bg-surface-container-low' : 'cursor-pointer hover:bg-primary-container/10',
              )}
              onClick={() => !hasBooking && onSlotClick(day, row.localMinute)}
            >
              <div className="w-14 shrink-0 text-center text-[11px] text-outline">
                {row.label}
              </div>
              <div className="flex-1 space-y-1 px-2 py-1">
                {cellBookings.map((booking) => (
                  <button
                    key={booking.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onBookingClick(booking);
                    }}
                    className={clsx(
                      'block w-full rounded-md px-2 py-1.5 text-left text-xs font-medium shadow-sm transition-opacity hover:opacity-90',
                      booking.userId === currentUserId
                        ? 'bg-primary text-on-primary'
                        : 'border border-outline bg-surface-container text-on-surface',
                    )}
                  >
                    {isAllRooms && (
                      <span className="font-medium">{booking.room.name} </span>
                    )}
                    <Icon name="schedule" size={11} className="mr-0.5" />
                    {formatTime(booking.startTime, displayTz)}
                    {' - '}
                    {formatTime(booking.endTime, displayTz)}
                    {booking.userId !== currentUserId && (
                      <span className="opacity-80"> - {booking.user.name}</span>
                    )}
                  </button>
                ))}
                {!hasBooking && (
                  <span className="text-[11px] text-on-surface-variant/40">Free</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatTime(iso: string, displayTz: string): string {
  const d = new Date(iso);
  const wall = getWallClockTime(d, displayTz);
  return `${String(wall.hours).padStart(2, '0')}:${String(wall.minutes).padStart(2, '0')}`;
}
