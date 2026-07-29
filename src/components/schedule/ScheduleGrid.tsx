'use client';

import { useState, useMemo, useEffect, Fragment } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import { getWallClockTime, getKyivDateParts, getKyivDayStart } from '@/utils/timezone';
import { BookingBlock } from './BookingBlock';
import { BookingPopover } from './BookingPopover';
import { GridDay } from './GridDay';
import { ROOM_COLORS } from './RoomFilterBar';

const TZ = 'Europe/Kyiv';

interface BookingData {
  id: string;
  startTime: string;
  endTime: string;
  userId: string;
  roomId: string;
  room: { id: string; name: string };
  user: { id: string; name: string };
}

interface RoomData {
  id: string;
  name: string;
  floor: number;
  capacity: number;
}

interface DayInfo {
  date: Date;
  year: number;
  month: number;
  day: number;
  weekday: number;
}

interface ScheduleGridProps {
  rooms: RoomData[];
  selectedRoomId: string | null;
  bookings: BookingData[];
  currentUserId: string;
  weekOffset: number;
  onWeekChange: (offset: number) => void;
  onSlotClick: (roomId: string, date: string, startTime: string) => void;
}

function getWeekDays(offset: number): DayInfo[] {
  const now = new Date();
  const todayParts = getKyivDateParts(now);
  const todayStart = getKyivDayStart(now);

  const daysSinceMonday = todayParts.weekday === 0 ? 6 : todayParts.weekday - 1;
  const mondayStart = new Date(todayStart.getTime() - daysSinceMonday * 86400000 + offset * 7 * 86400000);

  const days: DayInfo[] = [];
  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(mondayStart.getTime() + i * 86400000);
    const parts = getKyivDateParts(dayDate);
    days.push({ date: dayDate, ...parts });
  }
  return days;
}

function isToday(day: DayInfo): boolean {
  const now = new Date();
  const todayParts = getKyivDateParts(now);
  return todayParts.year === day.year && todayParts.month === day.month && todayParts.day === day.day;
}

function getRoomColor(roomId: string, rooms: RoomData[]): string {
  const idx = rooms.findIndex((r) => r.id === roomId);
  return ROOM_COLORS[idx >= 0 ? idx % ROOM_COLORS.length : 0];
}

function formatDateKey(day: DayInfo): string {
  return `${day.year}-${String(day.month + 1).padStart(2, '0')}-${String(day.day).padStart(2, '0')}`;
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 10 }, (_, i) => i + 9);
const HALF_HOURS = HOURS.flatMap((h) => [`${String(h).padStart(2, '0')}:00`, `${String(h).padStart(2, '0')}:30`]);

export function ScheduleGrid({
  rooms,
  selectedRoomId,
  bookings,
  currentUserId,
  weekOffset,
  onWeekChange,
  onSlotClick,
}: ScheduleGridProps) {
  const days = useMemo(() => getWeekDays(weekOffset), [weekOffset]);
  const [selectedBooking, setSelectedBooking] = useState<BookingData | null>(null);
  const [currentTimePos, setCurrentTimePos] = useState<number | null>(null);
  const [mobileDayIdx, setMobileDayIdx] = useState<number>(-1);

  useEffect(() => {
    function updateTime() {
      const now = new Date();
      const wall = getWallClockTime(now, TZ);
      const minutes = wall.hours * 60 + wall.minutes;
      if (minutes >= 540 && minutes <= 1140) {
        setCurrentTimePos(((minutes - 540) / 600) * 100);
      } else {
        setCurrentTimePos(null);
      }
    }
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const todayIdx = days.findIndex(isToday);
    setMobileDayIdx(todayIdx >= 0 ? todayIdx : 0);
  }, [days]);

  const todayIdx = days.findIndex(isToday);
  const isAllRooms = selectedRoomId === null;

  const filteredBookings = useMemo(() => {
    if (isAllRooms) return bookings;
    return bookings.filter((b) => b.roomId === selectedRoomId);
  }, [bookings, selectedRoomId, isAllRooms]);

  const bookingsByDay = useMemo(() => {
    const map = new Map<string, BookingData[]>();
    for (const b of filteredBookings) {
      const startDate = new Date(b.startTime);
      const parts = getKyivDateParts(startDate);
      const key = `${parts.year}-${String(parts.month + 1).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(b);
    }
    return map;
  }, [filteredBookings]);

  function handleBookingClick(booking: BookingData) {
    setSelectedBooking((prev) => (prev?.id === booking.id ? null : booking));
  }

  function handleSlotClick(day: DayInfo, hour: number, minute: number) {
    const roomId = isAllRooms ? rooms[0]?.id ?? '' : selectedRoomId!;
    if (!roomId) return;
    const startUtc = new Date(day.date.getTime() + hour * 3600000 + minute * 60000);
    onSlotClick(roomId, startUtc.toISOString(), new Date(startUtc.getTime() + 30 * 60000).toISOString());
  }

  const weekLabel = `Week of ${days[0].date.toLocaleDateString('en-US', { timeZone: TZ, month: 'short', day: 'numeric', year: 'numeric' })}`;

  return (
    <div className="relative">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onWeekChange(weekOffset - 1)}
          className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="text-sm font-medium text-zinc-700">{weekLabel}</span>
        <button
          type="button"
          onClick={() => onWeekChange(weekOffset + 1)}
          className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="lg:hidden">
        <div className="mb-2 flex gap-1 overflow-x-auto pb-1">
          {days.map((day, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setMobileDayIdx(i)}
              className={clsx(
                'shrink-0 rounded-lg px-3 py-2 text-xs font-medium transition-colors',
                i === mobileDayIdx
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200',
                isToday(day) && i !== mobileDayIdx && 'ring-1 ring-inset ring-zinc-300',
              )}
            >
              <div>{WEEKDAY_LABELS[day.weekday]}</div>
              <div className="mt-0.5 opacity-70">{day.day}</div>
            </button>
          ))}
        </div>

        {mobileDayIdx >= 0 && (
          <div className="relative">
            {days.map((day, i) => (
              <div key={i} className={clsx(i !== mobileDayIdx && 'hidden')}>
                <GridDay
                  day={day}
                  bookings={bookingsByDay.get(formatDateKey(day)) ?? []}
                  currentUserId={currentUserId}
                  isAllRooms={isAllRooms}
                  isToday={isToday(day)}
                  currentTimePos={currentTimePos}
                  onSlotClick={handleSlotClick}
                  onBookingClick={handleBookingClick}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="hidden lg:block overflow-x-auto">
        <div
          className="grid min-w-[900px]"
          style={{
            gridTemplateColumns: `60px repeat(7, 1fr)`,
            gridTemplateRows: `auto repeat(20, 28px)`,
          }}
        >
          <div className="sticky top-0 z-20 bg-white border-b border-zinc-200" />
          {days.map((day, i) => (
            <div
              key={i}
              className={clsx(
                'sticky top-0 z-20 border-b border-zinc-200 bg-white px-2 py-2 text-center text-xs font-medium',
                isToday(day) && 'text-indigo-600',
              )}
            >
              <div>{WEEKDAY_LABELS[day.weekday]}</div>
              <div className="text-zinc-400">{day.day}</div>
            </div>
          ))}

          {HALF_HOURS.map((time, rowIdx) => (
            <Fragment key={rowIdx}>
              <div
                className="flex items-center justify-end pr-2 text-xs text-zinc-400 border-r border-zinc-100"
                style={{ gridRow: rowIdx + 2 }}
              >
                {time}
              </div>
              {days.map((day, dayIdx) => {
                const hour = Math.floor(rowIdx / 2) + 9;
                const minute = rowIdx % 2 === 0 ? 0 : 30;
                return (
                  <div
                    key={`cell-${dayIdx}-${rowIdx}`}
                    className={clsx(
                      'relative border-b border-r border-zinc-100 cursor-pointer transition-colors hover:bg-zinc-50',
                      rowIdx % 2 === 0 ? 'border-t-0' : '',
                    )}
                    style={{ gridRow: rowIdx + 2, gridColumn: dayIdx + 2 }}
                    onClick={() => handleSlotClick(day, hour, minute)}
                  />
                );
              })}
            </Fragment>
          ))}

          {days.map((day, dayIdx) => {
            const dayKey = formatDateKey(day);
            const dayBookings = bookingsByDay.get(dayKey) ?? [];
            return (
              <div
                key={`overlay-${dayIdx}`}
                className="relative pointer-events-none"
                style={{ gridRow: '2 / -1', gridColumn: dayIdx + 2 }}
              >
                {isToday(day) && currentTimePos !== null && (
                  <div
                    className="absolute left-0 right-0 z-20 h-[2px] bg-red-500"
                    style={{ top: `${currentTimePos}%` }}
                  />
                )}
                {dayBookings.map((booking) => (
                  <div key={booking.id} className="relative">
                    <BookingBlock
                      booking={booking}
                      currentUserId={currentUserId}
                      roomColor={getRoomColor(booking.roomId, rooms)}
                      isAllRooms={isAllRooms}
                      onClick={handleBookingClick}
                    />
                    {selectedBooking?.id === booking.id && (
                      <BookingPopover
                        booking={booking}
                        onClose={() => setSelectedBooking(null)}
                      />
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
