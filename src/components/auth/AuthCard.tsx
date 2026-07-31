'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { clsx } from 'clsx';
import { Icon } from '@/components/ui/Icon';

interface AuthCardProps {
  activeTab: 'login' | 'register';
  children: ReactNode;
}

export function AuthCard({ activeTab, children }: AuthCardProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background font-body-md text-on-background">
      <main className="relative flex flex-grow items-center justify-center overflow-hidden px-4 py-10">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[120px]" />

        <div className="relative flex w-full max-w-[440px] flex-col items-center rounded-xl border border-outline/20 bg-surface-container p-6">
          <div className="mb-6 flex flex-col items-center gap-1">
            <div className="mb-1 flex h-16 w-16 items-center justify-center rounded-lg bg-surface-variant p-3 text-primary">
              <Icon name="calendar_month" size={32} />
            </div>
            <h1 className="text-headline-md tracking-tight text-on-surface">meet-schedule-lab</h1>
          </div>

          <div className="mb-6 grid w-full grid-cols-2 rounded-lg border border-outline/10 bg-surface-variant p-1">
            <Link
              href="/login"
              className={clsx(
                'rounded py-1 text-center text-label-md transition-all duration-150',
                activeTab === 'login'
                  ? 'bg-surface text-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface',
              )}
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className={clsx(
                'rounded py-1 text-center text-label-md transition-all duration-150',
                activeTab === 'register'
                  ? 'bg-surface text-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface',
              )}
            >
              Sign Up
            </Link>
          </div>

          {children}
        </div>
      </main>

      <footer className="w-full border-t border-outline/10 bg-surface py-6">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-2 px-4 md:flex-row">
          <div className="text-label-md text-on-surface">meet-schedule-lab</div>
          <div className="text-center text-body-md text-on-surface-variant opacity-80 md:text-left">
            &copy; 2026 meet-schedule-lab. Precision scheduling for modern teams.
          </div>
        </div>
      </footer>
    </div>
  );
}
