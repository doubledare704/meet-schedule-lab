'use client';

import { useState, type FormEvent } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

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

    setLoading(true);

    try {
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
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="New Booking">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Room</label>
          <select
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
          >
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} (capacity: {r.capacity})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Date</label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Start</label>
            <select
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
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
            >
              {TIME_OPTIONS.filter((t) => t < '19:00').map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">End</label>
            <select
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
            >
              {TIME_OPTIONS.filter((t) => t > startTime).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Book
          </Button>
        </div>
      </form>
    </Modal>
  );
}
