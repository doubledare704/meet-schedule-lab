'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

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
    <Modal open={open} onClose={onClose} title="Cancel Booking?">
      <div className="space-y-4 p-6">
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-error/30 bg-error-container/40 px-4 py-3 text-body-sm text-on-surface">
            <Icon name="error" size={18} className="text-error" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-error-container">
            <Icon name="warning" size={32} className="text-error" filled />
          </div>
          {booking && (
            <p className="text-body-md text-on-surface-variant">
              Are you sure you want to cancel your booking at{' '}
              <span className="font-bold text-on-surface">{booking.room.name}</span> on{' '}
              <span className="font-bold text-on-surface">
                {new Date(booking.startTime).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}{' '}
                {new Date(booking.startTime).toLocaleTimeString('en-GB', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              ? This action cannot be undone.
            </p>
          )}
        </div>

        {isRecurring && (
          <div className="space-y-2 rounded-lg border border-outline-variant bg-surface-container-low p-4">
            <p className="text-label-md font-medium text-on-surface">
              This is a recurring booking
            </p>
            <label className="flex items-center gap-2 text-body-sm text-on-surface-variant">
              <input
                type="radio"
                name="cancelScope"
                value="this"
                checked={scope === 'this'}
                onChange={() => setScope('this')}
                className="accent-primary"
              />
              Only this instance
            </label>
            <label className="flex items-center gap-2 text-body-sm text-on-surface-variant">
              <input
                type="radio"
                name="cancelScope"
                value="future"
                checked={scope === 'future'}
                onChange={() => setScope('future')}
                className="accent-primary"
              />
              This and all future instances
            </label>
          </div>
        )}

        <div className="flex flex-col gap-3 pt-2">
          <Button
            type="button"
            variant="danger"
            loading={loading}
            onClick={handleConfirm}
            className="w-full py-3 shadow-lg shadow-error/20"
          >
            {scope === 'future' ? 'Yes, Cancel Series' : 'Yes, Cancel'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="w-full py-3"
          >
            Keep Booking
          </Button>
        </div>
      </div>
      <div className="h-1 bg-gradient-to-r from-error/40 via-error to-error/40" />
    </Modal>
  );
}
