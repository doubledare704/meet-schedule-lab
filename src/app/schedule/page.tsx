'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { RoomFilterBar } from '@/components/schedule/RoomFilterBar';
import { ScheduleGrid } from '@/components/schedule/ScheduleGrid';
import { BookingModal } from '@/components/schedule/BookingModal';

interface UserData {
  id: string;
  email: string;
  name: string;
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
    const now = new Date();
    const target = new Date(now);
    target.setMinutes(target.getMinutes() >= 30 ? 60 : 30, 0, 0);
    if (target.getHours() < 9) {
      target.setHours(9, 0, 0, 0);
    } else if (target.getHours() >= 18) {
      target.setDate(target.getDate() + 1);
      target.setHours(10, 0, 0, 0);
    }
    const end = new Date(target.getTime() + 30 * 60000);

    setPrefilledRoomId(roomId ?? rooms[0]?.id ?? null);
    setPrefilledStart(target.toISOString());
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
      />
    </AppShell>
  );
}
