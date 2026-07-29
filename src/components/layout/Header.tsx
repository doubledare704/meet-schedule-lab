'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { LogOut } from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '@/components/ui/Button';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { NotificationToast } from '@/components/notifications/NotificationToast';

interface HeaderProps {
  userName: string;
}

export function Header({ userName }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [source, setSource] = useState<EventSource | null>(null);

  useEffect(() => {
    const eventSource = new EventSource('/api/notifications/sse');

    eventSource.onerror = () => {
      eventSource.close();
    };

    setSource(eventSource);

    return () => {
      eventSource.close();
      setSource(null);
    };
  }, []);

  async function handleLogout() {
    source?.close();
    const res = await fetch('/api/auth/logout', { method: 'POST' });
    if (res.ok) {
      router.push('/login');
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link
            href="/schedule"
            className="text-lg font-semibold text-zinc-900 hover:text-zinc-700 transition-colors"
          >
            Meet Schedule Lab
          </Link>
          <nav className="flex items-center gap-1">
            <Link
              href="/schedule"
              className={clsx(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                pathname === '/schedule'
                  ? 'bg-zinc-100 text-zinc-900'
                  : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50',
              )}
            >
              Schedule
            </Link>
            <Link
              href="/my-bookings"
              className={clsx(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                pathname === '/my-bookings'
                  ? 'bg-zinc-100 text-zinc-900'
                  : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50',
              )}
            >
              My Bookings
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell source={source} />
          <span className="text-sm text-zinc-500">{userName}</span>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut size={16} className="mr-1" />
            Log out
          </Button>
        </div>
      </div>
      <NotificationToast source={source} />
    </header>
  );
}
