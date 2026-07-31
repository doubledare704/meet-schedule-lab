'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { Icon } from '@/components/ui/Icon';

interface NavItem {
  href?: string;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/schedule', label: 'Schedule', icon: 'calendar_month' },
  { href: '/my-bookings', label: 'My Bookings', icon: 'event_available' },
  { label: 'Rooms', icon: 'meeting_room' },
  { label: 'Analytics', icon: 'analytics' },
  { label: 'Team', icon: 'group' },
];

interface SidebarProps {
  onBookRoomClick?: () => void;
}

export function Sidebar({ onBookRoomClick }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-full w-64 flex-col border-r border-outline-variant bg-surface-container-low px-4 py-10 md:flex">
      <div className="mb-10 px-4">
        <h2 className="text-headline-md font-bold text-primary">Booking Lab</h2>
        <p className="mt-1 text-label-sm text-on-surface-variant">Admin Console</p>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = item.href ? pathname === item.href : false;
          const inner = (
            <>
              <Icon name={item.icon} size={20} />
              <span className="text-label-md">{item.label}</span>
            </>
          );
          const className = clsx(
            'flex items-center gap-4 rounded-lg px-4 py-2 transition-all active:scale-95',
            active
              ? 'border-l-4 border-primary bg-secondary-container text-on-secondary-container'
              : 'text-on-surface-variant hover:bg-surface-container-high',
          );
          return item.href ? (
            <Link key={item.label} href={item.href} className={className}>
              {inner}
            </Link>
          ) : (
            <button key={item.label} type="button" className={className} disabled>
              {inner}
            </button>
          );
        })}
      </nav>

      <div className="px-4 pt-6">
        {onBookRoomClick ? (
          <button
            type="button"
            onClick={onBookRoomClick}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2 text-label-md text-on-primary transition-opacity hover:opacity-90"
          >
            <Icon name="add" size={18} />
            Book Room
          </button>
        ) : (
          <Link
            href="/schedule?action=new"
            className="flex items-center justify-center gap-2 rounded-lg bg-primary py-2 text-label-md text-on-primary transition-opacity hover:opacity-90"
          >
            <Icon name="add" size={18} />
            Book Room
          </Link>
        )}
      </div>
    </aside>
  );
}
