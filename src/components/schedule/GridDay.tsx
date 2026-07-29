'use client';

import { clsx } from 'clsx';
import { getWallClockTime } from '@/utils/timezone';

const TZ = 'Europe/Kyiv';
const HALF_HOURS = Array.from({ length: 20 }, (_, i) => {
  const h = Math.floor(i / 2) + 9;
  const m = i % 2 === 0 ? '00' : '30';
  return `${String(h).padStart(2, '0')}:${m}`;
});

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
  onSlotClick: (day: DayInfo, hour: number, minute: number) => void;
  onBookingClick: (booking: BookingData) => void;
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function GridDay({
  day,
  bookings,
  currentUserId,
  isAllRooms,
  isToday,
  onSlotClick,
  onBookingClick,
}: GridDayProps) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-500">
          {day.day} {WEEKDAY_LABELS[day.weekday]}
        </span>
        {isToday && (
          <span className="text-xs font-medium text-red-500">Now</span>
        )}
      </div>
      <div className="mt-2 overflow-hidden rounded-xl border border-zinc-200 bg-white">
        {HALF_HOURS.map((time, rowIdx) => {
          const hour = Math.floor(rowIdx / 2) + 9;
          const minute = rowIdx % 2 === 0 ? 0 : 30;
          const startMin = hour * 60 + minute;
          const endMin = startMin + 30;

          const cellBookings = bookings.filter((b) => {
            const bStart = getWallClockTime(new Date(b.startTime), TZ);
            const bEnd = getWallClockTime(new Date(b.endTime), TZ);
            const bStartMin = bStart.hours * 60 + bStart.minutes;
            const bEndMin = bEnd.hours * 60 + bEnd.minutes;
            return bStartMin < endMin && bEndMin > startMin;
          });

          const hasBooking = cellBookings.length > 0;

          return (
            <div
              key={rowIdx}
              className={clsx(
                'flex min-h-[48px] items-center border-b border-zinc-100 last:border-0',
                hasBooking ? 'bg-zinc-50' : 'cursor-pointer hover:bg-indigo-50/30',
              )}
              onClick={() => !hasBooking && onSlotClick(day, hour, minute)}
            >
              <div className="w-14 shrink-0 text-center text-[11px] text-zinc-400">
                {time}
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
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-400 text-white',
                    )}
                  >
                    {isAllRooms && (
                      <span className="font-medium">{booking.room.name} </span>
                    )}
                    {new Date(booking.startTime).toLocaleTimeString('en-GB', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {' - '}
                    {new Date(booking.endTime).toLocaleTimeString('en-GB', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {booking.userId !== currentUserId && (
                      <span className="opacity-80"> - {booking.user.name}</span>
                    )}
                  </button>
                ))}
                {!hasBooking && (
                  <span className="text-[11px] text-zinc-300">Free</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
