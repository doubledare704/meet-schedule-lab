'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface BookingData {
  id: string;
  startTime: string;
  endTime: string;
  recurringSeriesId?: string | null;
  room: { id: string; name: string };
}

interface CancelBookingModalProps {
  open: boolean;
  booking: BookingData | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function CancelBookingModal({
  open,
  booking,
  onClose,
  onSuccess,
}: CancelBookingModalProps) {
  const [scope, setScope] = useState<'this' | 'future'>('this');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isRecurring = !!booking?.recurringSeriesId;

  async function handleConfirm() {
    if (!booking) return;

    setLoading(true);
    setError(null);

    try {
      const url =
        scope === 'future'
          ? `/api/bookings/${booking.id}?scope=future`
          : `/api/bookings/${booking.id}`;

      const res = await fetch(url, { method: 'DELETE' });

      const body = await res.json();
      if (!body.success) {
        setError(body.error || 'Failed to cancel booking');
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
    <Modal open={open} onClose={onClose} title="Cancel Booking">
      <div className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">
            {error}
          </div>
        )}

        {booking && (
          <p className="text-sm text-zinc-600">
            Cancel booking at <strong>{booking.room.name}</strong> on{' '}
            {new Date(booking.startTime).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}{' '}
            {new Date(booking.startTime).toLocaleTimeString('en-GB', {
              hour: '2-digit',
              minute: '2-digit',
            })}
            ?
          </p>
        )}

        {isRecurring && (
          <div className="space-y-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
            <p className="text-sm font-medium text-zinc-700">This is a recurring booking</p>
            <label className="flex items-center gap-2 text-sm text-zinc-600">
              <input
                type="radio"
                name="cancelScope"
                value="this"
                checked={scope === 'this'}
                onChange={() => setScope('this')}
                className="text-zinc-900"
              />
              Only this instance
            </label>
            <label className="flex items-center gap-2 text-sm text-zinc-600">
              <input
                type="radio"
                name="cancelScope"
                value="future"
                checked={scope === 'future'}
                onChange={() => setScope('future')}
                className="text-zinc-900"
              />
              This and all future instances
            </label>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Keep Booking
          </Button>
          <Button
            type="button"
            variant="danger"
            loading={loading}
            onClick={handleConfirm}
          >
            {scope === 'future' ? 'Cancel Series' : 'Cancel Booking'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
