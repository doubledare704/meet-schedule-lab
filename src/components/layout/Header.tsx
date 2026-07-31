'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { NotificationBell } from '@/components/notifications/NotificationBell';

interface HeaderProps {
  userName: string;
  source: EventSource | null;
}

export function Header({ userName, source }: HeaderProps) {
  const router = useRouter();

  async function handleLogout() {
    const res = await fetch('/api/auth/logout', { method: 'POST' });
    if (res.ok) {
      router.push('/login');
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-outline-variant bg-surface">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/schedule" className="text-headline-md font-bold text-primary">
          meet-schedule-lab
        </Link>

        <div className="flex items-center gap-2">
          <NotificationBell source={source} />
          <ThemeToggle />
          <span className="material-symbols-outlined hidden rounded-full p-2 text-on-surface-variant sm:inline-block">
            settings
          </span>
          <div className="ml-1 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-primary bg-surface-container-high text-label-md font-medium text-on-surface">
              {userName.charAt(0).toUpperCase()}
            </div>
            <span className="hidden text-label-md text-on-surface-variant md:inline">
              {userName}
            </span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="ml-1 rounded-lg p-2 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-error"
            aria-label="Log out"
          >
            <Icon name="logout" size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
