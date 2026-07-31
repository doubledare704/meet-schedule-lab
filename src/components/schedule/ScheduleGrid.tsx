'use client';

import { useState, useMemo, useEffect, Fragment } from 'react';
import { clsx } from 'clsx';
import { Icon } from '@/components/ui/Icon';
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

function isWeekend(day: DayInfo): boolean {
  return day.weekday === 0 || day.weekday === 6;
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

  const todayIdx = days.findIndex(isToday);
  const activeMobileDayIdx = mobileDayIdx >= 0 ? mobileDayIdx : todayIdx >= 0 ? todayIdx : 0;
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
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1 rounded-lg border border-outline-variant bg-surface-container-low p-0.5">
          <button
            type="button"
            onClick={() => onWeekChange(weekOffset - 1)}
            aria-label="Previous week"
            className="rounded p-1 text-on-surface-variant transition-colors hover:bg-surface-variant"
          >
            <Icon name="chevron_left" size={20} />
          </button>
          <button
            type="button"
            onClick={() => onWeekChange(0)}
            className="rounded px-3 py-1 text-label-md text-on-surface-variant transition-colors hover:bg-surface-variant"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => onWeekChange(weekOffset + 1)}
            aria-label="Next week"
            className="rounded p-1 text-on-surface-variant transition-colors hover:bg-surface-variant"
          >
            <Icon name="chevron_right" size={20} />
          </button>
        </div>
        <h2 className="text-headline-md font-bold text-on-surface">{weekLabel}</h2>
      </div>

      <div className="mb-4 flex items-center gap-2 rounded-lg border-l-4 border-primary bg-surface-container px-4 py-2">
        <Icon name="info" size={18} className="text-primary" />
        <p className="text-label-md text-on-surface-variant">
          Times displayed in your local time (UTC+2). Enforcing office hours (09:00&ndash;19:00 Europe/Kyiv).
        </p>
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
                i === activeMobileDayIdx
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high',
                isToday(day) && i !== activeMobileDayIdx && 'ring-1 ring-inset ring-primary',
              )}
            >
              <div>{WEEKDAY_LABELS[day.weekday]}</div>
              <div className="mt-0.5 opacity-70">{day.day}</div>
            </button>
          ))}
        </div>

        {activeMobileDayIdx >= 0 && (
          <div className="relative">
            {days.map((day, i) => (
              <div key={i} className={clsx(i !== activeMobileDayIdx && 'hidden')}>
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

      <div className="hidden overflow-x-auto lg:block">
        <div
          className="grid min-w-[900px] overflow-hidden rounded-xl border border-outline-variant bg-surface shadow-sm"
          style={{
            gridTemplateColumns: `80px repeat(7, 1fr)`,
            gridTemplateRows: `auto repeat(20, 28px)`,
          }}
        >
          <div className="sticky top-0 z-20 border-b border-outline-variant bg-surface-container-low" />
          {days.map((day, i) => (
            <div
              key={i}
              className={clsx(
                'sticky top-0 z-20 border-b border-r border-outline-variant bg-surface-container-low px-2 py-2 text-center',
                isToday(day) && 'bg-primary-fixed bg-opacity-10 ring-inset ring-2 ring-primary',
                isWeekend(day) && !isToday(day) && 'bg-surface-container-lowest opacity-60',
              )}
            >
              <div
                className={clsx(
                  'text-label-sm uppercase tracking-wider',
                  isToday(day) ? 'font-bold text-primary' : 'text-outline',
                )}
              >
                {WEEKDAY_LABELS[day.weekday]}
              </div>
              <div className={clsx('text-headline-md', isToday(day) ? 'font-bold text-primary' : 'text-on-surface')}>
                {day.day}
              </div>
              {isToday(day) && (
                <div className="mt-0.5 text-[10px] font-bold text-primary">TODAY</div>
              )}
            </div>
          ))}

          {HALF_HOURS.map((time, rowIdx) => (
            <Fragment key={rowIdx}>
              <div
                className="flex items-center justify-end border-r border-outline-variant pr-2 text-label-sm text-outline"
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
                      'relative cursor-pointer border-b border-r border-outline-variant transition-colors hover:bg-primary-container hover:bg-opacity-5',
                      isWeekend(day) && 'bg-surface-container-lowest opacity-60',
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
                    className="current-time-line"
                    style={{ top: `${currentTimePos}%` }}
                  />
                )}
                {dayBookings.map((booking) => (
                  <BookingBlock
                    key={booking.id}
                    booking={booking}
                    currentUserId={currentUserId}
                    roomColor={getRoomColor(booking.roomId, rooms)}
                    isAllRooms={isAllRooms}
                    onClick={handleBookingClick}
                  >
                    {selectedBooking?.id === booking.id && (
                      <BookingPopover
                        booking={booking}
                        onClose={() => setSelectedBooking(null)}
                      />
                    )}
                  </BookingBlock>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
