'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { CancelBookingModal } from '@/components/bookings/CancelBookingModal';
import { clsx } from 'clsx';

interface UserData {
  id: string;
  email: string;
  name: string;
}

interface BookingData {
  id: string;
  startTime: string;
  endTime: string;
  recurringSeriesId: string | null;
  room: { id: string; name: string };
  user: { id: string; name: string };
}

export default function MyBookingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelTarget, setCancelTarget] = useState<BookingData | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((body) => {
        if (!body.success) {
          router.push('/login');
          return;
        }
        setUser(body.data.user);
      })
      .catch(() => router.push('/login'));
  }, [router]);

  useEffect(() => {
    if (!user) return;

    fetch('/api/bookings?mine=true')
      .then((r) => r.json())
      .then((body) => {
        if (body.success) {
          setBookings(body.data);
        }
      })
      .finally(() => setLoading(false));
  }, [user]);

  async function refreshBookings() {
    const res = await fetch('/api/bookings?mine=true');
    const body = await res.json();
    if (body.success) {
      setBookings(body.data);
    }
  }

  function handleCancel(booking: BookingData) {
    setCancelTarget(booking);
    setCancelOpen(true);
  }

  const now = new Date();
  const upcoming = bookings.filter((b) => new Date(b.startTime) > now);
  const past = bookings.filter((b) => new Date(b.startTime) <= now);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-zinc-50">
      <Header userName={user.name} />
      <main className="mx-auto max-w-4xl px-4 py-6 space-y-6">
        <h2 className="text-xl font-semibold text-zinc-900">My Bookings</h2>

        {loading ? (
          <div className="py-12 text-center text-sm text-zinc-400">Loading...</div>
        ) : bookings.length === 0 ? (
          <div className="py-12 text-center text-sm text-zinc-400">
            No bookings yet.{' '}
            <button
              type="button"
              onClick={() => router.push('/schedule')}
              className="text-zinc-900 underline underline-offset-2 hover:text-zinc-700"
            >
              Book a room
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            <section>
              <h3 className="mb-3 text-sm font-medium text-zinc-500 uppercase tracking-wide">
                Upcoming ({upcoming.length})
              </h3>
              <Table
                bookings={upcoming}
                onCancel={handleCancel}
              />
            </section>

            <section>
              <h3 className="mb-3 text-sm font-medium text-zinc-500 uppercase tracking-wide">
                Past ({past.length})
              </h3>
              <Table
                bookings={past}
                onCancel={handleCancel}
                readonly
              />
            </section>
          </div>
        )}
      </main>

      <CancelBookingModal
        open={cancelOpen}
        booking={cancelTarget}
        onClose={() => {
          setCancelOpen(false);
          setCancelTarget(null);
        }}
        onSuccess={refreshBookings}
      />
    </div>
  );
}

function Table({
  bookings,
  onCancel,
  readonly,
}: {
  bookings: BookingData[];
  onCancel: (b: BookingData) => void;
  readonly?: boolean;
}) {
  if (bookings.length === 0) {
    return <p className="py-6 text-sm text-zinc-400">None</p>;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-100 bg-zinc-50 text-left text-xs font-medium uppercase text-zinc-500">
            <th className="px-4 py-3">Room</th>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Time</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b.id} className="border-b border-zinc-100 last:border-0">
              <td className="px-4 py-3 font-medium text-zinc-800">{b.room.name}</td>
              <td className="px-4 py-3 text-zinc-600">
                {new Date(b.startTime).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </td>
              <td className="px-4 py-3 text-zinc-600">
                {new Date(b.startTime).toLocaleTimeString('en-GB', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}{' '}
                -{' '}
                {new Date(b.endTime).toLocaleTimeString('en-GB', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </td>
              <td className="px-4 py-3">
                {b.recurringSeriesId ? (
                  <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                    Recurring
                  </span>
                ) : (
                  <span className="text-zinc-400">One-off</span>
                )}
              </td>
              <td className="px-4 py-3 text-right">
                {!readonly && (
                  <button
                    type="button"
                    onClick={() => onCancel(b)}
                    className={clsx(
                      'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                      'text-red-600 hover:bg-red-50',
                    )}
                  >
                    Cancel
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
