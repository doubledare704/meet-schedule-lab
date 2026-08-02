'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { MobileDrawer } from '@/components/mobile/MobileDrawer';
import { MobileBookRoomCTA } from '@/components/mobile/MobileBookRoomCTA';
import { NotificationToast } from '@/components/notifications/NotificationToast';
import {
  getNotificationSource,
  closeNotificationSource,
} from '@/lib/notification-source';

interface AppShellProps {
  userName: string;
  onBookRoomClick?: () => void;
  children: ReactNode;
}

export function AppShell({ userName, onBookRoomClick, children }: AppShellProps) {
  const [source] = useState<EventSource | null>(getNotificationSource);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    function handlePageHide() {
      closeNotificationSource();
    }
    window.addEventListener('pagehide', handlePageHide);
    return () => window.removeEventListener('pagehide', handlePageHide);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar onBookRoomClick={onBookRoomClick} />
      <MobileDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onBookRoomClick={onBookRoomClick}
      />
      <div className="pb-20 md:pb-0 md:pl-64">
        <Header
          userName={userName}
          source={source}
          onMenuClick={() => setIsDrawerOpen(true)}
        />
        <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-8">{children}</main>
      </div>
      <MobileBookRoomCTA onClick={onBookRoomClick} />
      <NotificationToast source={source} />
    </div>
  );
}
