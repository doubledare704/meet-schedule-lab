'use client';

import { Icon } from '@/components/ui/Icon';

interface MobileBookRoomCTAProps {
  onClick?: () => void;
}

export function MobileBookRoomCTA({ onClick }: MobileBookRoomCTAProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-outline-variant bg-surface p-4 md:hidden">
      {onClick ? (
        <button
          type="button"
          onClick={onClick}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-on-primary shadow-md transition-opacity hover:opacity-90 active:scale-95"
        >
          <Icon name="event_available" size={20} />
          <span className="text-label-md">Book Room</span>
        </button>
      ) : (
        <a
          href="/schedule?action=new"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-on-primary shadow-md transition-opacity hover:opacity-90 active:scale-95"
        >
          <Icon name="event_available" size={20} />
          <span className="text-label-md">Book Room</span>
        </a>
      )}
    </div>
  );
}