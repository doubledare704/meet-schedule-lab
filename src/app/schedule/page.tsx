'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
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
      });
  }, [capacityFilter]);

  useEffect(() => {
    if (selectedRoomId && !rooms.some((r) => r.id === selectedRoomId)) {
      setSelectedRoomId(null);
    }
  }, [rooms, selectedRoomId]);

  const fetchBookings = useCallback(async () => {
    const params = new URLSearchParams();
    if (selectedRoomId) params.set('roomId', selectedRoomId);
    const res = await fetch(`/api/bookings?${params.toString()}`);
    const body = await res.json();
    if (body.success) setBookings(body.data);
  }, [selectedRoomId]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

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
    <div className="min-h-screen bg-zinc-50">
      <Header userName={user.name} />
      <main className="mx-auto max-w-7xl px-4 py-6 space-y-6">
        <RoomFilterBar
          rooms={rooms}
          selectedRoomId={selectedRoomId}
          capacityFilter={capacityFilter}
          onRoomChange={setSelectedRoomId}
          onCapacityChange={(cap) => {
            setCapacityFilter(cap);
            setSelectedRoomId(null);
          }}
        />
        <ScheduleGrid
          rooms={rooms}
          selectedRoomId={selectedRoomId}
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
      </main>
    </div>
  );
}
