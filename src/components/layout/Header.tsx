'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface HeaderProps {
  userName: string;
}

export function Header({ userName }: HeaderProps) {
  const router = useRouter();

  async function handleLogout() {
    const res = await fetch('/api/auth/logout', { method: 'POST' });
    if (res.ok) {
      router.push('/login');
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <h1 className="text-lg font-semibold text-zinc-900">Meet Schedule Lab</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-500">{userName}</span>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut size={16} className="mr-1" />
            Log out
          </Button>
        </div>
      </div>
    </header>
  );
}
