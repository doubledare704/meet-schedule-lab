'use client';

import { clsx } from 'clsx';
import { Icon } from '@/components/ui/Icon';

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
    <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
      <div className="hidden md:flex flex-1 gap-2 overflow-x-auto no-scrollbar pr-2">
        <button
          type="button"
          onClick={() => onRoomChange(null)}
          className={clsx(
            'shrink-0 rounded-full px-4 py-2 text-label-md transition-all active:scale-95',
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
              'shrink-0 rounded-full px-4 py-2 text-label-md transition-all active:scale-95',
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
            <span className="ml-1 text-on-surface-variant opacity-70">
              ({room.capacity})
            </span>
          </button>
        ))}
      </div>

      <div className="flex shrink-0 gap-1">
        {CAPACITY_OPTIONS.map((opt) => (
          <button
            key={opt.label}
            type="button"
            onClick={() => onCapacityChange(opt.value)}
            className={clsx(
              'rounded-full px-3 py-2 text-label-sm transition-all active:scale-95',
              capacityFilter === opt.value
                ? 'bg-secondary text-on-secondary shadow-sm'
                : 'border border-outline-variant bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high',
            )}
          >
            {opt.value ? (
              <span className="flex items-center gap-1">
                <Icon name="filter_list" size={14} />
                {opt.label}
              </span>
            ) : (
              'Any'
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
