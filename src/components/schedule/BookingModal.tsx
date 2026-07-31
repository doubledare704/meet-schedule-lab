'use client';

import { useState, type FormEvent } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { getWallClockTime, getKyivDayStart } from '@/utils/timezone';

const TZ = 'Europe/Kyiv';

interface RoomData {
  id: string;
  name: string;
  capacity: number;
}

interface BookingModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  rooms: RoomData[];
  prefilledRoomId: string | null;
  prefilledStart: string;
  prefilledEnd: string;
}

const TIME_OPTIONS: string[] = [];
for (let h = 9; h <= 18; h++) {
  TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:00`);
  TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:30`);
}
TIME_OPTIONS.push('19:00');

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function combineDateAndTime(dateStr: string, timeStr: string): string {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const utcDate = new Date(dateStr + 'T00:00:00Z');
  const kyivMidnight = getKyivDayStart(utcDate);
  return new Date(kyivMidnight.getTime() + hours * 3600000 + minutes * 60000).toISOString();
}

function formatISOToDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: TZ });
}

function formatISOToTime(iso: string): string {
  const d = new Date(iso);
  const wall = getWallClockTime(d, TZ);
  return `${String(wall.hours).padStart(2, '0')}:${String(wall.minutes).padStart(2, '0')}`;
}

export function BookingModal({
  open,
  onClose,
  onSuccess,
  rooms,
  prefilledRoomId,
  prefilledStart,
  prefilledEnd,
}: BookingModalProps) {
  const [roomId, setRoomId] = useState(prefilledRoomId ?? rooms[0]?.id ?? '');
  const [date, setDate] = useState(formatISOToDate(prefilledStart));
  const [startTime, setStartTime] = useState(formatISOToTime(prefilledStart));
  const [endTime, setEndTime] = useState(formatISOToTime(prefilledEnd));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [recurring, setRecurring] = useState(false);
  const [untilDate, setUntilDate] = useState('');
  const [summary, setSummary] = useState<{
    createdCount: number;
    skippedCount: number;
  } | null>(null);

  function getDayOfWeek(): number {
    const parsed = new Date(date + 'T00:00:00Z');
    if (Number.isNaN(parsed.getTime())) return 1;
    return parsed.getUTCDay();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSummary(null);

    if (!roomId) {
      setError('Please select a room');
      return;
    }

    const startISO = combineDateAndTime(date, startTime);
    const endISO = combineDateAndTime(date, endTime);

    if (new Date(endISO) <= new Date(startISO)) {
      setError('End time must be after start time');
      return;
    }

    if (recurring && !untilDate) {
      setError('Please set an end date for the recurring series');
      return;
    }

    if (recurring && new Date(untilDate) <= new Date(date)) {
      setError('Until date must be after the start date');
      return;
    }

    setLoading(true);

    try {
      if (recurring) {
        const res = await fetch('/api/bookings/recurring', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId,
            dayOfWeek: getDayOfWeek(),
            startTime,
            endTime,
            startDate: startISO,
            untilDate: new Date(untilDate + 'T23:59:59Z').toISOString(),
          }),
        });

        const body = await res.json();
        if (!body.success) {
          setError(body.error || 'Failed to create recurring series');
          return;
        }

        setSummary({
          createdCount: body.data.created.length,
          skippedCount: body.data.skipped.length,
        });
        onSuccess();
      } else {
        const res = await fetch('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId,
            startTime: startISO,
            endTime: endISO,
          }),
        });

        const body = await res.json();
        if (!body.success) {
          setError(body.error || 'Failed to create booking');
          return;
        }

        onSuccess();
        onClose();
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setSummary(null);
    setError(null);
    setRecurring(false);
    setUntilDate('');
    onClose();
  }

  if (summary) {
    return (
      <Modal open={open} onClose={handleClose} title="Recurring Series Created">
        <div className="space-y-4 p-6">
          <div className="flex items-center gap-2 rounded-lg border border-tertiary/30 bg-tertiary/10 px-4 py-3 text-body-sm text-on-surface">
            <Icon name="check_circle" size={18} className="text-tertiary" />
            <span>
              Created {summary.createdCount} booking{summary.createdCount !== 1 ? 's' : ''}
              {summary.skippedCount > 0 && (
                <span className="text-on-surface-variant">
                  {' '}({summary.skippedCount} skipped due to conflicts)
                </span>
              )}
            </span>
          </div>
          <div className="flex justify-end">
            <Button type="button" onClick={handleClose}>
              Done
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  const fieldClass =
    'w-full rounded-lg border border-transparent bg-surface-variant py-3 pl-10 pr-4 text-body-md text-on-surface outline-none transition-all placeholder:text-outline focus:border-primary';

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="New Room Reservation"
      subtitle="Secure a professional space for your team."
    >
      <form onSubmit={handleSubmit} className="space-y-6 p-6">
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-error/30 bg-error-container/40 px-4 py-3 text-body-sm text-on-surface">
            <Icon name="error" size={18} className="text-error" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-1">
          <label className="text-label-md text-on-surface-variant" htmlFor="booking-room">
            Room
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-outline">
              <Icon name="meeting_room" size={20} />
            </span>
            <select
              id="booking-room"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className={`${fieldClass} appearance-none`}
            >
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.capacity} person)
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-outline">
              <Icon name="expand_more" size={20} />
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-1">
            <label className="text-label-md text-on-surface-variant" htmlFor="booking-date">
              Date
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                <Icon name="calendar_today" size={18} />
              </span>
              <input
                id="booking-date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full min-w-0 rounded-lg border border-transparent bg-surface-variant py-3 pl-8 pr-1 text-sm text-on-surface outline-none transition-all focus:border-primary [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-70"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-label-md text-on-surface-variant" htmlFor="booking-start">
              Start Time
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-outline">
                <Icon name="schedule" size={20} />
              </span>
              <select
                id="booking-start"
                value={startTime}
                onChange={(e) => {
                  const newStart = e.target.value;
                  setStartTime(newStart);
                  const startIdx = TIME_OPTIONS.indexOf(newStart);
                  if (startIdx >= 0 && startIdx < TIME_OPTIONS.length - 1) {
                    const nextTime = TIME_OPTIONS[startIdx + 1];
                    if (TIME_OPTIONS.indexOf(endTime) <= startIdx) {
                      setEndTime(nextTime);
                    }
                  }
                }}
                className={`${fieldClass} appearance-none`}
              >
                {TIME_OPTIONS.filter((t) => t < '19:00').map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-outline">
                <Icon name="expand_more" size={20} />
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-label-md text-on-surface-variant" htmlFor="booking-end">
              End Time
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-outline">
                <Icon name="timer" size={20} />
              </span>
              <select
                id="booking-end"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className={`${fieldClass} appearance-none`}
              >
                {TIME_OPTIONS.filter((t) => t > startTime).map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-outline">
                <Icon name="expand_more" size={20} />
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-outline-variant py-4">
          <div className="flex items-center gap-4">
            <Icon name="repeat" size={24} className="text-primary-container" />
            <div>
              <p className="text-label-md font-bold text-on-surface">Repeat Weekly</p>
              <p className="text-[12px] text-on-surface-variant">
                Create a recurring series on {WEEKDAY_LABELS[getDayOfWeek()] || 'Mon'}s
              </p>
            </div>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              checked={recurring}
              onChange={(e) => setRecurring(e.target.checked)}
              className="peer sr-only"
            />
            <div className="h-6 w-11 rounded-full bg-surface-variant transition-colors after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-outline after:bg-surface-container-lowest after:transition-all after:content-[''] peer-checked:bg-primary-container peer-checked:after:translate-x-full" />
          </label>
        </div>

        {recurring && (
          <div className="space-y-1">
            <label className="text-label-md text-on-surface-variant" htmlFor="booking-until">
              Repeat until
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                <Icon name="event_repeat" size={18} />
              </span>
              <input
                id="booking-until"
                type="date"
                required
                value={untilDate}
                onChange={(e) => setUntilDate(e.target.value)}
                className="w-full min-w-0 rounded-lg border border-transparent bg-surface-variant py-3 pl-8 pr-1 text-sm text-on-surface outline-none transition-all focus:border-primary [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-70"
              />
            </div>
          </div>
        )}

        <div className="-mx-6 -mb-6 flex flex-col-reverse gap-4 border-t border-outline-variant bg-surface-variant/30 px-6 py-5 md:flex-row md:justify-end">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            {recurring ? 'Create Series' : 'Confirm Reservation'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
