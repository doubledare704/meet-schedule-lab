'use client';

import { useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { Icon } from '@/components/ui/Icon';

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/schedule', label: 'Schedule', icon: 'calendar_month' },
  { href: '/my-bookings', label: 'My Bookings', icon: 'event_available' },
];

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onBookRoomClick?: () => void;
}

export function MobileDrawer({ isOpen, onClose, onBookRoomClick }: MobileDrawerProps) {
  const pathname = usePathname();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-on-surface/20 backdrop-blur-[2px] md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <div
        className={clsx(
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-outline-variant bg-surface-container-low transition-transform duration-300 ease-in-out md:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between border-b border-outline-variant px-4 py-4">
          <h2 className="text-headline-md font-bold text-primary">Booking Lab</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-on-surface-variant transition-colors hover:bg-surface-container-high active:scale-95"
            aria-label="Close menu"
          >
            <Icon name="close" size={24} />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-4">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            const className = clsx(
              'flex items-center gap-4 rounded-lg px-4 py-3 transition-all active:scale-95',
              active
                ? 'border-l-4 border-primary bg-secondary-container text-on-secondary-container'
                : 'text-on-surface-variant hover:bg-surface-container-high',
            );
            return (
              <Link key={item.label} href={item.href} onClick={onClose} className={className}>
                <Icon name={item.icon} size={20} />
                <span className="text-label-md">{item.label}</span>
              </Link>
            );
          })}

          <div className="mt-4">
            {onBookRoomClick ? (
              <button
                type="button"
                onClick={() => {
                  onBookRoomClick();
                  onClose();
                }}
                className="flex w-full items-center gap-4 rounded-lg bg-primary px-4 py-3 text-on-primary shadow-md transition-opacity hover:opacity-90 active:scale-95"
              >
                <Icon name="add" size={20} />
                <span className="text-label-md">Book Room</span>
              </button>
            ) : (
              <Link
                href="/schedule?action=new"
                onClick={onClose}
                className="flex w-full items-center gap-4 rounded-lg bg-primary px-4 py-3 text-on-primary shadow-md transition-opacity hover:opacity-90 active:scale-95"
              >
                <Icon name="add" size={20} />
                <span className="text-label-md">Book Room</span>
              </Link>
            )}
          </div>
        </nav>
      </div>
    </>
  );
}