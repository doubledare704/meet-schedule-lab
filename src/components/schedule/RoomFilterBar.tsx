'use client';

import { clsx } from 'clsx';

interface Room {
  id: string;
  name: string;
  floor: number;
  capacity: number;
}

interface RoomFilterBarProps {
  rooms: Room[];
  selectedRoomId: string | null;
  capacityFilter: number | null;
  onRoomChange: (roomId: string | null) => void;
  onCapacityChange: (capacity: number | null) => void;
}

export const ROOM_COLORS = [
  '#4f46e5',
  '#10b981',
  '#f59e0b',
  '#e11d48',
  '#06b6d4',
  '#8b5cf6',
  '#f97316',
  '#14b8a6',
];

const CAPACITY_OPTIONS = [
  { label: 'Any', value: null },
  { label: '2+', value: 2 },
  { label: '4+', value: 4 },
  { label: '6+', value: 6 },
  { label: '8+', value: 8 },
];

export function RoomFilterBar({
  rooms,
  selectedRoomId,
  capacityFilter,
  onRoomChange,
  onCapacityChange,
}: RoomFilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onRoomChange(null)}
          className={clsx(
            'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
            selectedRoomId === null
              ? 'border-zinc-900 bg-zinc-900 text-white'
              : 'border-zinc-300 text-zinc-600 hover:border-zinc-400 hover:text-zinc-800',
          )}
        >
          All Rooms
        </button>
        {rooms.map((room, idx) => (
          <button
            key={room.id}
            type="button"
            onClick={() => onRoomChange(room.id)}
            className={clsx(
              'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
              selectedRoomId === room.id
                ? 'border-zinc-900 bg-zinc-900 text-white'
                : 'border-zinc-300 text-zinc-600 hover:border-zinc-400 hover:text-zinc-800',
            )}
          >
            <span
              className="mr-1.5 inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: ROOM_COLORS[idx % ROOM_COLORS.length] }}
            />
            {room.name}
          </button>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <span className="text-sm text-zinc-500">Capacity:</span>
        <select
          value={capacityFilter ?? ''}
          onChange={(e) =>
            onCapacityChange(e.target.value ? Number(e.target.value) : null)
          }
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
        >
          {CAPACITY_OPTIONS.map((opt) => (
            <option key={opt.label} value={opt.value ?? ''}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
