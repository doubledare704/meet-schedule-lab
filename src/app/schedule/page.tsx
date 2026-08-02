'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { RoomFilterBar } from '@/components/schedule/RoomFilterBar';
import { ScheduleGrid, getWeekOffsetForDate } from '@/components/schedule/ScheduleGrid';
import { BookingModal } from '@/components/schedule/BookingModal';
import { Icon } from '@/components/ui/Icon';
import { useDisplayTimezone } from '@/lib/use-display-timezone';
import { getNextOfficeSlot } from '@/utils/timezone';

interface UserData {
  id: string;
  email: string;
  name: string;
  isEmailVerified: boolean;
}

interface RoomData {
  id: string;
  name: string;
  floor: number;
  capacity: number;
}

interface BookingData {
  id: string;
  startTime: string;
  endTime: string;
  userId: string;
  roomId: string;
  room: { id: string; name: string };
  user: { id: string; name: string };
}

export default function SchedulePage() {
  const router = useRouter();
  const displayTz = useDisplayTimezone();
  const [user, setUser] = useState<UserData | null>(null);
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [capacityFilter, setCapacityFilter] = useState<number | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [prefilledRoomId, setPrefilledRoomId] = useState<string | null>(null);
  const [prefilledStart, setPrefilledStart] = useState('');
  const [prefilledEnd, setPrefilledEnd] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('roomId');
    const dateParam = params.get('date');
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((body) => {
        if (!body.success) {
          router.push('/login');
          return;
        }
        if (roomParam) setSelectedRoomId(roomParam);
        if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
          setWeekOffset(getWeekOffsetForDate(dateParam, displayTz));
        }
        setUser(body.data.user);
      })
      .catch(() => router.push('/login'));
  }, [router, displayTz]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (capacityFilter !== null) params.set('capacity', String(capacityFilter));
    fetch(`/api/rooms?${params.toString()}`)
      .then((r) => r.json())
      .then((body) => {
        if (body.success) {
          setRooms(body.data);
        }
      })
      .catch(() => setRooms([]));
  }, [capacityFilter]);

  const effectiveSelectedRoomId =
    selectedRoomId !== null && rooms.some((r) => r.id === selectedRoomId)
      ? selectedRoomId
      : null;

  const fetchBookings = useCallback(() => {
    const params = new URLSearchParams();
    if (effectiveSelectedRoomId) params.set('roomId', effectiveSelectedRoomId);
    return fetch(`/api/bookings?${params.toString()}`)
      .then((r) => r.json())
      .then((body) => {
        if (body.success) setBookings(body.data);
      })
      .catch(() => setBookings([]));
  }, [effectiveSelectedRoomId]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleOpenNewModal = useCallback((roomId?: string | null) => {
    const start = getNextOfficeSlot(new Date());
    const end = new Date(start.getTime() + 30 * 60000);

    setPrefilledRoomId(roomId ?? rooms[0]?.id ?? null);
    setPrefilledStart(start.toISOString());
    setPrefilledEnd(end.toISOString());
    setModalOpen(true);
  }, [rooms]);

  function handleSlotClick(roomId: string, startISO: string, endISO: string) {
    setPrefilledRoomId(roomId);
    setPrefilledStart(startISO);
    setPrefilledEnd(endISO);
    setModalOpen(true);
  }

  function handleBookingCreated() {
    fetchBookings();
  }

  if (!user) return null;

  return (
    <AppShell userName={user.name} onBookRoomClick={() => handleOpenNewModal(effectiveSelectedRoomId)}>
      {!user.isEmailVerified && (
        <div className="flex items-center gap-2 rounded-lg border border-secondary/40 bg-secondary-container/40 px-4 py-3 text-body-sm text-on-surface">
          <Icon name="mark_email_unread" size={18} className="text-secondary" />
          <span>
            Your email is not verified. Please check the server console logs for the verification link to unlock booking.
          </span>
        </div>
      )}
      <RoomFilterBar
        rooms={rooms}
        selectedRoomId={effectiveSelectedRoomId}
        capacityFilter={capacityFilter}
        onRoomChange={setSelectedRoomId}
        onCapacityChange={(cap) => {
          setCapacityFilter(cap);
          setSelectedRoomId(null);
        }}
      />
      <ScheduleGrid
        rooms={rooms}
        selectedRoomId={effectiveSelectedRoomId}
        bookings={bookings}
        currentUserId={user.id}
        weekOffset={weekOffset}
        displayTz={displayTz}
        onWeekChange={setWeekOffset}
        onSlotClick={handleSlotClick}
      />
      <BookingModal
        key={String(modalOpen) + prefilledStart}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleBookingCreated}
        rooms={rooms}
        prefilledRoomId={prefilledRoomId}
        prefilledStart={prefilledStart}
        prefilledEnd={prefilledEnd}
        canBook={user.isEmailVerified}
        displayTz={displayTz}
      />
    </AppShell>
  );
}
