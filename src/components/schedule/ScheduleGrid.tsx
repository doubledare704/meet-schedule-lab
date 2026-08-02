'use client';

import { useState, useMemo, useEffect, Fragment } from 'react';
import { clsx } from 'clsx';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import {
  getDateParts,
  getDayStart,
  getDayStartForCalendarDate,
  getOfficeWindow,
  getWallClockTime,
  officeRowIndexForLocalMinute,
  OFFICE_DAY_MINUTES,
  type OfficeWindowRow,
} from '@/utils/timezone';
import { BookingBlock } from './BookingBlock';
import { BookingPopover } from './BookingPopover';
import { GridDay } from './GridDay';
import { ROOM_COLORS } from './RoomFilterBar';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';

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
  displayTz: string;
  onWeekChange: (offset: number) => void;
  onSlotClick: (roomId: string, date: string, startTime: string) => void;
}

function getWeekDays(offset: number, displayTz: string): DayInfo[] {
  const now = new Date();
  const todayParts = getDateParts(now, displayTz);
  const todayStart = getDayStart(now, displayTz);

  const daysSinceMonday = todayParts.weekday === 0 ? 6 : todayParts.weekday - 1;
  const mondayStart = new Date(todayStart.getTime() - daysSinceMonday * 86400000 + offset * 7 * 86400000);

  const days: DayInfo[] = [];
  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(mondayStart.getTime() + i * 86400000);
    const parts = getDateParts(dayDate, displayTz);
    days.push({ date: dayDate, ...parts });
  }
  return days;
}

export function getWeekOffsetForDate(dateStr: string, displayTz: string): number {
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return 0;

  const targetDayStart = getDayStartForCalendarDate(year, month - 1, day, displayTz);
  const targetParts = getDateParts(targetDayStart, displayTz);
  const targetMonday = new Date(targetDayStart.getTime() - (targetParts.weekday === 0 ? 6 : targetParts.weekday - 1) * 86400000);

  const now = new Date();
  const todayStart = getDayStart(now, displayTz);
  const nowParts = getDateParts(now, displayTz);
  const nowMonday = new Date(todayStart.getTime() - (nowParts.weekday === 0 ? 6 : nowParts.weekday - 1) * 86400000);

  return Math.round((targetMonday.getTime() - nowMonday.getTime()) / (7 * 86400000));
}

function isToday(day: DayInfo, displayTz: string): boolean {
  const now = new Date();
  const todayParts = getDateParts(now, displayTz);
  return todayParts.year === day.year && todayParts.month === day.month && todayParts.day === day.day;
}

function isWeekend(day: DayInfo): boolean {
  return day.weekday === 0 || day.weekday === 6;
}

function getRoomColor(roomId: string, rooms: RoomData[]): string {
  const idx = rooms.findIndex((r) => r.id === roomId);
  return ROOM_COLORS[idx >= 0 ? idx % ROOM_COLORS.length : 0];
}

interface PlacedBooking {
  booking: BookingData;
  leftPct: number;
  widthPct: number;
}

function layoutDayBookings(bookings: BookingData[], rows: readonly OfficeWindowRow[], displayTz: string): PlacedBooking[] {
  if (bookings.length === 0) return [];

  const toRowIndex = (iso: string): number => {
    const wall = getWallClockTime(new Date(iso), displayTz);
    return officeRowIndexForLocalMinute(wall.hours * 60 + wall.minutes, rows);
  };

  const toEndRowIndex = (iso: string): number => {
    const index = toRowIndex(iso);
    return index < 0 ? rows.length : index;
  };

  const sorted = [...bookings].sort((a, b) => {
    const startDiff = toRowIndex(a.startTime) - toRowIndex(b.startTime);
    if (startDiff !== 0) return startDiff;
    return toEndRowIndex(b.endTime) - toEndRowIndex(a.endTime);
  });

  const columnEnds: number[] = [];
  const placed: PlacedBooking[] = [];

  for (const booking of sorted) {
    const start = Math.max(0, toRowIndex(booking.startTime));
    const end = toEndRowIndex(booking.endTime);

    let column = columnEnds.findIndex((columnEnd) => columnEnd <= start);
    if (column === -1) {
      column = columnEnds.length;
      columnEnds.push(0);
    }
    columnEnds[column] = Math.max(columnEnds[column], end);

    const totalColumns = columnEnds.length;
    placed.push({
      booking,
      leftPct: (column / totalColumns) * 100,
      widthPct: 100 / totalColumns,
    });
  }

  return placed;
}

function formatDateKey(day: DayInfo): string {
  return `${day.year}-${String(day.month + 1).padStart(2, '0')}-${String(day.day).padStart(2, '0')}`;
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const ROW_COUNT = 20;

export function ScheduleGrid({
  rooms,
  selectedRoomId,
  bookings,
  currentUserId,
  weekOffset,
  displayTz,
  onWeekChange,
  onSlotClick,
}: ScheduleGridProps) {
  const days = useMemo(() => getWeekDays(weekOffset, displayTz), [weekOffset, displayTz]);
  const [selectedBooking, setSelectedBooking] = useState<BookingData | null>(null);
  const [currentTimePos, setCurrentTimePos] = useState<number | null>(null);
  const [mobileDayIdx, setMobileDayIdx] = useState<number>(-1);
  const [pastSlotStart, setPastSlotStart] = useState<string | null>(null);

  const handleSwipeLeft = () => {
    if (activeMobileDayIdx < days.length - 1) {
      setMobileDayIdx(activeMobileDayIdx + 1);
    } else if (weekOffset < 4) {
      onWeekChange(weekOffset + 1);
      setMobileDayIdx(0);
    }
  };

  const handleSwipeRight = () => {
    if (activeMobileDayIdx > 0) {
      setMobileDayIdx(activeMobileDayIdx - 1);
    } else if (weekOffset > -4) {
      onWeekChange(weekOffset - 1);
      setMobileDayIdx(6);
    }
  };

  const swipeHandlers = useSwipeGesture({
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
    threshold: 50,
  });

  useEffect(() => {
    function updateTime() {
      const now = new Date();
      const todayStart = getDayStart(now, displayTz);
      const rows = getOfficeWindow(todayStart, displayTz);
      const wall = getWallClockTime(now, displayTz);
      const localMinutes = wall.hours * 60 + wall.minutes;
      const windowStart = rows[0]?.localMinute ?? 0;
      let delta = localMinutes - windowStart;
      if (delta < 0) delta += 1440;
      if (delta >= 0 && delta <= OFFICE_DAY_MINUTES) {
        setCurrentTimePos((delta / OFFICE_DAY_MINUTES) * 100);
      } else {
        setCurrentTimePos(null);
      }
    }
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [displayTz]);

  const todayIdx = days.findIndex((day) => isToday(day, displayTz));
  const activeMobileDayIdx = mobileDayIdx >= 0 ? mobileDayIdx : todayIdx >= 0 ? todayIdx : 0;
  const isAllRooms = selectedRoomId === null;

  const filteredBookings = useMemo(() => {
    if (isAllRooms) return bookings;
    return bookings.filter((b) => b.roomId === selectedRoomId);
  }, [bookings, selectedRoomId, isAllRooms]);

  const rowsByDay = useMemo(() => {
    const map = new Map<string, OfficeWindowRow[]>();
    for (const day of days) {
      map.set(formatDateKey(day), getOfficeWindow(day.date, displayTz));
    }
    return map;
  }, [days, displayTz]);

  const bookingsByDay = useMemo(() => {
    const map = new Map<string, BookingData[]>();
    for (const b of filteredBookings) {
      const startDate = new Date(b.startTime);
      const parts = getDateParts(startDate, displayTz);
      const key = `${parts.year}-${String(parts.month + 1).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(b);
    }
    return map;
  }, [filteredBookings, displayTz]);

  const placedBookingsByDay = useMemo(() => {
    const map = new Map<string, PlacedBooking[]>();
    for (const [key, list] of bookingsByDay) {
      const rows = rowsByDay.get(key) ?? [];
      map.set(key, isAllRooms ? layoutDayBookings(list, rows, displayTz) : list.map((b) => ({ booking: b, leftPct: 0, widthPct: 100 })));
    }
    return map;
  }, [bookingsByDay, isAllRooms, rowsByDay, displayTz]);

  function handleBookingClick(booking: BookingData) {
    setSelectedBooking((prev) => (prev?.id === booking.id ? null : booking));
  }

  function handleSlotClick(day: DayInfo, localMinute: number) {
    const roomId = isAllRooms ? rooms[0]?.id ?? '' : selectedRoomId!;
    if (!roomId) return;
    const startUtc = new Date(day.date.getTime() + localMinute * 60000);
    if (startUtc.getTime() <= new Date().getTime()) {
      setPastSlotStart(startUtc.toISOString());
      return;
    }
    onSlotClick(roomId, startUtc.toISOString(), new Date(startUtc.getTime() + 30 * 60000).toISOString());
  }

  function formatPastSlotLabel(iso: string): string {
    return new Date(iso).toLocaleString('en-US', {
      timeZone: displayTz,
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  const weekLabel = `Week of ${days[0].date.toLocaleDateString('en-US', { timeZone: displayTz, month: 'short', day: 'numeric', year: 'numeric' })}`;

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
          Times displayed in your local timezone ({displayTz}). Enforcing office hours (09:00&ndash;19:00 Europe/Kyiv).
        </p>
      </div>

      <div className="lg:hidden" {...swipeHandlers}>
        <div className="mb-4 rounded-xl bg-surface-container-low p-4">
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => onWeekChange(weekOffset - 1)}
              aria-label="Previous week"
              className="rounded-lg p-2 text-on-surface-variant transition-colors hover:bg-surface-container active:scale-95"
            >
              <Icon name="chevron_left" size={20} />
            </button>
            <div className="text-center">
              <div className="text-headline-md font-bold text-on-surface">
                {days[activeMobileDayIdx]?.date.toLocaleDateString('en-US', {
                  timeZone: displayTz,
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                })}
              </div>
              {isToday(days[activeMobileDayIdx], displayTz) && (
                <div className="mt-0.5 text-label-sm font-bold text-primary">TODAY</div>
              )}
            </div>
            <button
              type="button"
              onClick={() => onWeekChange(weekOffset + 1)}
              aria-label="Next week"
              className="rounded-lg p-2 text-on-surface-variant transition-colors hover:bg-surface-container active:scale-95"
            >
              <Icon name="chevron_right" size={20} />
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {days.map((day, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setMobileDayIdx(i)}
                className={clsx(
                  'shrink-0 rounded-lg px-3 py-2 text-xs font-medium transition-all active:scale-95',
                  i === activeMobileDayIdx
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high',
                  isToday(day, displayTz) && i !== activeMobileDayIdx && 'ring-1 ring-inset ring-primary',
                )}
              >
                <div>{WEEKDAY_LABELS[day.weekday]}</div>
                <div className="mt-0.5 opacity-70">{day.day}</div>
              </button>
            ))}
          </div>
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
                  isToday={isToday(day, displayTz)}
                  currentTimePos={currentTimePos}
                  displayTz={displayTz}
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
            gridTemplateRows: `auto repeat(${ROW_COUNT}, 28px)`,
          }}
        >
          <div className="sticky top-0 z-20 border-b border-outline-variant bg-surface-container-low" />
          {days.map((day, i) => (
            <div
              key={i}
              className={clsx(
                'sticky top-0 z-20 border-b border-r border-outline-variant bg-surface-container-low px-2 py-2 text-center',
                isToday(day, displayTz) && 'bg-primary-fixed bg-opacity-10 ring-inset ring-2 ring-primary',
                isWeekend(day) && !isToday(day, displayTz) && 'bg-surface-container-lowest opacity-60',
              )}
            >
              <div
                className={clsx(
                  'text-label-sm uppercase tracking-wider',
                  isToday(day, displayTz) ? 'font-bold text-primary' : 'text-outline',
                )}
              >
                {WEEKDAY_LABELS[day.weekday]}
              </div>
              <div className={clsx('text-headline-md', isToday(day, displayTz) ? 'font-bold text-primary' : 'text-on-surface')}>
                {day.day}
              </div>
              {isToday(day, displayTz) && (
                <div className="mt-0.5 text-[10px] font-bold text-primary">TODAY</div>
              )}
            </div>
          ))}

          {Array.from({ length: ROW_COUNT }, (_, rowIdx) => {
            const rows = rowsByDay.get(formatDateKey(days[0])) ?? [];
            const label = rows[rowIdx]?.label ?? '';
            return (
              <Fragment key={rowIdx}>
                <div
                  className="flex items-center justify-end border-r border-outline-variant pr-2 text-label-sm text-outline"
                  style={{ gridRow: rowIdx + 2 }}
                >
                  {label}
                </div>
                {days.map((day, dayIdx) => {
                  const localMinute = rowsByDay.get(formatDateKey(day))?.[rowIdx]?.localMinute ?? 0;
                  return (
                    <div
                      key={`cell-${dayIdx}-${rowIdx}`}
                      className={clsx(
                        'relative cursor-pointer border-b border-r border-outline-variant transition-colors hover:bg-primary-container hover:bg-opacity-5',
                        isWeekend(day) && 'bg-surface-container-lowest opacity-60',
                      )}
                      style={{ gridRow: rowIdx + 2, gridColumn: dayIdx + 2 }}
                      onClick={() => handleSlotClick(day, localMinute)}
                    />
                  );
                })}
              </Fragment>
            );
          })}

          {days.map((day, dayIdx) => {
            const dayKey = formatDateKey(day);
            const placedBookings = placedBookingsByDay.get(dayKey) ?? [];
            return (
              <div
                key={`overlay-${dayIdx}`}
                className="relative pointer-events-none"
                style={{ gridRow: '2 / -1', gridColumn: dayIdx + 2 }}
              >
                {isToday(day, displayTz) && currentTimePos !== null && (
                  <div
                    className="current-time-line"
                    style={{ top: `${currentTimePos}%` }}
                  />
                )}
                {placedBookings.map(({ booking, leftPct, widthPct }) => (
                  <BookingBlock
                    key={booking.id}
                    booking={booking}
                    currentUserId={currentUserId}
                    roomColor={getRoomColor(booking.roomId, rooms)}
                    isAllRooms={isAllRooms}
                    displayTz={displayTz}
                    leftPct={leftPct}
                    widthPct={widthPct}
                    onClick={handleBookingClick}
                  >
                    {selectedBooking?.id === booking.id && (
                      <BookingPopover
                        booking={booking}
                        displayTz={displayTz}
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

      <Modal
        open={pastSlotStart !== null}
        onClose={() => setPastSlotStart(null)}
        title="Time Slot Unavailable"
      >
        <div className="space-y-4 p-6">
          <div className="flex items-start gap-3 rounded-lg border border-error/30 bg-error-container/40 px-4 py-3">
            <Icon name="event_busy" size={20} className="mt-0.5 shrink-0 text-error" />
            <div>
              <p className="text-body-sm text-on-surface">
                {pastSlotStart
                  ? `${formatPastSlotLabel(pastSlotStart)} is in the past and can no longer be booked.`
                  : 'This time slot is in the past and can no longer be booked.'}
              </p>
              <p className="mt-1 text-label-sm text-on-surface-variant">
                Please select a future time slot.
              </p>
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="button" onClick={() => setPastSlotStart(null)}>
              Got it
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
