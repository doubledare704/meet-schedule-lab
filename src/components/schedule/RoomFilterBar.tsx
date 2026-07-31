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
  '#268bd2',
  '#2aa198',
  '#b58900',
  '#d33682',
  '#859900',
  '#cb4b16',
  '#6c71c4',
  '#dc322f',
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
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onRoomChange(null)}
          className={clsx(
            'rounded-full px-4 py-2 text-label-md transition-all active:scale-95',
            selectedRoomId === null
              ? 'bg-primary text-on-primary shadow-sm'
              : 'border border-outline-variant bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high',
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
              'rounded-full px-4 py-2 text-label-md transition-all active:scale-95',
              selectedRoomId === room.id
                ? 'bg-primary text-on-primary shadow-sm'
                : 'border border-outline-variant bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high',
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
        <span className="text-label-md text-on-surface-variant">Capacity:</span>
        <select
          value={capacityFilter ?? ''}
          onChange={(e) =>
            onCapacityChange(e.target.value ? Number(e.target.value) : null)
          }
          className="rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-label-md text-on-surface focus:border-primary focus:outline-none"
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
