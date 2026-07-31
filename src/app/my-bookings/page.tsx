'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { CancelBookingModal } from '@/components/bookings/CancelBookingModal';
import { Icon } from '@/components/ui/Icon';
import { clsx } from 'clsx';

interface UserData {
  id: string;
  email: string;
  name: string;
}

interface BookingData {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  recurringSeriesId: string | null;
  room: { id: string; name: string };
  user: { id: string; name: string };
}

type Tab = 'upcoming' | 'past';

export default function MyBookingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('upcoming');
  const [cancelTarget, setCancelTarget] = useState<BookingData | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [pastPage, setPastPage] = useState(0);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((body) => {
        if (!body.success) {
          router.push('/login');
          setLoading(false);
          return;
        }
        setUser(body.data.user);
        setAuthChecked(true);
      })
      .catch(() => {
        setLoading(false);
        router.push('/login');
      });
  }, [router]);

  useEffect(() => {
    if (!user) return;

    fetch('/api/bookings?mine=true')
      .then((r) => r.json())
      .then((body) => {
        if (body.success) {
          setBookings(body.data);
        } else {
          setLoadError(body.error || 'Failed to load your bookings.');
        }
      })
      .catch(() => setLoadError('Network error while loading your bookings.'))
      .finally(() => setLoading(false));
  }, [user]);

  async function refreshBookings() {
    try {
      const res = await fetch('/api/bookings?mine=true');
      const body = await res.json();
      if (body.success) {
        setBookings(body.data);
      }
    } catch {
      setLoadError('Network error while loading your bookings.');
    }
  }

  function handleCancel(booking: BookingData) {
    setCancelTarget(booking);
    setCancelOpen(true);
  }

  const now = new Date();
  const upcoming = bookings
    .filter((b) => new Date(b.startTime) > now)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  const past = bookings
    .filter((b) => new Date(b.startTime) <= now)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const PAST_PAGE_SIZE = 5;
  const pastPageCount = Math.max(1, Math.ceil(past.length / PAST_PAGE_SIZE));
  const safePastPage = Math.min(pastPage, pastPageCount - 1);
  const visible =
    tab === 'upcoming'
      ? upcoming
      : past.slice(safePastPage * PAST_PAGE_SIZE, (safePastPage + 1) * PAST_PAGE_SIZE);

  function handleOpenRoomSchedule(booking: BookingData) {
    const dateKey = new Date(booking.startTime).toLocaleDateString('en-CA', { timeZone: TZ });
    router.push(`/schedule?roomId=${encodeURIComponent(booking.room.id)}&date=${dateKey}`);
  }

  if (!authChecked || (!user && loading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-on-surface-variant">
          <span className="h-8 w-8 animate-spin rounded-full border-4 border-outline border-t-primary" />
          <p className="text-body-md">Loading your reservations...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <AppShell userName={user.name}>
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="mb-1 text-headline-lg text-on-surface">My Reservations</h1>
            <p className="text-body-md text-on-surface-variant">
              Manage and track your upcoming room bookings across campus.
            </p>
          </div>
          <div className="inline-flex self-start rounded-lg bg-surface-variant p-1">
            {(['upcoming', 'past'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setTab(t);
                  setPastPage(0);
                }}
                className={clsx(
                  'rounded-md px-6 py-2 text-label-md transition-all',
                  tab === t
                    ? 'bg-surface text-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface',
                )}
              >
                {t === 'upcoming' ? 'Upcoming' : 'Past'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-body-sm text-on-surface-variant">Loading...</div>
        ) : loadError && bookings.length === 0 ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-xl border border-error/30 bg-error-container/20 p-10 text-center">
            <Icon name="cloud_off" size={32} className="text-error" />
            <p className="text-body-md text-on-surface">{loadError}</p>
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                setLoadError(null);
                fetch('/api/bookings?mine=true')
                  .then((r) => r.json())
                  .then((body) => {
                    if (body.success) setBookings(body.data);
                    else setLoadError(body.error || 'Failed to load your bookings.');
                  })
                  .catch(() => setLoadError('Network error while loading your bookings.'))
                  .finally(() => setLoading(false));
              }}
              className="rounded-lg border border-outline bg-surface-container px-6 py-2 text-label-md text-primary transition-colors hover:bg-surface-container-high"
            >
              Retry
            </button>
          </div>
        ) : bookings.length === 0 ? (
          <EmptyState onBrowse={() => router.push('/schedule')} />
        ) : visible.length === 0 ? (
          <div className="min-h-[320px] rounded-xl border border-dashed border-outline-variant bg-surface p-10">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-container-low text-primary-container">
                <Icon name="event_busy" size={32} />
              </div>
              <h3 className="text-headline-md text-on-surface">
                No {tab === 'upcoming' ? 'upcoming' : 'past'} reservations
              </h3>
              <p className="max-w-xs text-body-md text-on-surface-variant">
                Your booking history is currently empty for the selected filter.
              </p>
              {tab === 'upcoming' && (
                <button
                  type="button"
                  onClick={() => router.push('/schedule')}
                  className="rounded-lg border border-outline bg-surface-container px-6 py-2 text-label-md text-primary transition-colors hover:bg-surface-container-high"
                >
                  Browse Available Slots
                </button>
              )}
            </div>
          </div>
        ) : (
          <Table
            bookings={visible}
            tab={tab}
            onCancel={handleCancel}
            onRowClick={handleOpenRoomSchedule}
            pagination={
              tab === 'past' && past.length > PAST_PAGE_SIZE
                ? { page: safePastPage, pageCount: pastPageCount, onPageChange: setPastPage }
                : undefined
            }
          />
        )}
      </div>

      <CancelBookingModal
        open={cancelOpen}
        booking={cancelTarget}
        onClose={() => {
          setCancelOpen(false);
          setCancelTarget(null);
        }}
        onSuccess={refreshBookings}
      />
    </AppShell>
  );
}

function EmptyState({ onBrowse }: { onBrowse: () => void }) {
  return (
    <div className="min-h-[320px] rounded-xl border border-dashed border-outline-variant bg-surface p-10">
      <div className="flex flex-col items-center justify-center space-y-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-container-low text-primary-container">
          <Icon name="event_available" size={32} />
        </div>
        <h3 className="text-headline-md text-on-surface">No reservations yet</h3>
        <p className="max-w-xs text-body-md text-on-surface-variant">
          Book a room to get started with your first reservation.
        </p>
        <button
          type="button"
          onClick={onBrowse}
          className="rounded-lg border border-outline bg-surface-container px-6 py-2 text-label-md text-primary transition-colors hover:bg-surface-container-high"
        >
          Browse Available Slots
        </button>
      </div>
    </div>
  );
}

const TZ = 'Europe/Kyiv';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    timeZone: TZ,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface Pagination {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}

function Table({
  bookings,
  tab,
  onCancel,
  onRowClick,
  pagination,
}: {
  bookings: BookingData[];
  tab: Tab;
  onCancel: (b: BookingData) => void;
  onRowClick: (b: BookingData) => void;
  pagination?: Pagination;
}) {
  const readonly = tab === 'past';

  return (
    <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-outline-variant bg-surface-container-low">
              <th className="px-6 py-4 text-label-md text-on-surface-variant">Title</th>
              <th className="px-6 py-4 text-label-md text-on-surface-variant">Room</th>
              <th className="px-6 py-4 text-label-md text-on-surface-variant">Date &amp; Time</th>
              <th className="px-6 py-4 text-center text-label-md text-on-surface-variant">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {bookings.map((b) => (
              <tr
                key={b.id}
                onClick={() => onRowClick(b)}
                className="group cursor-pointer transition-colors hover:bg-surface-variant/30"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-on-surface">{b.title || 'Untitled'}</span>
                    {b.recurringSeriesId && (
                      <span className="rounded bg-tertiary/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-tertiary">
                        Weekly
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Icon name="meeting_room" size={18} className="text-primary" />
                    <span className="text-on-surface">{b.room.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-on-surface">{formatDate(b.startTime)}</span>
                    <span className="text-label-sm text-on-surface-variant">
                      {formatTime(b.startTime)} - {formatTime(b.endTime)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  {!readonly && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCancel(b);
                      }}
                      title="Cancel Reservation"
                      className="rounded-full p-2 text-error opacity-60 transition-all hover:bg-error-container/20 hover:opacity-100"
                    >
                      <Icon name="cancel" size={20} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && pagination.pageCount > 1 && (
        <div className="flex items-center justify-between border-t border-outline-variant px-6 py-3">
          <span className="text-label-sm text-on-surface-variant">
            Page {pagination.page + 1} of {pagination.pageCount}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={pagination.page === 0}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              className="rounded-lg border border-outline px-3 py-1.5 text-label-sm text-on-surface transition-colors hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={pagination.page === pagination.pageCount - 1}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              className="rounded-lg border border-outline px-3 py-1.5 text-label-sm text-on-surface transition-colors hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
