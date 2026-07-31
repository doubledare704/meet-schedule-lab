'use client';

import { useState } from 'react';
import { clsx } from 'clsx';
import { Icon } from './Icon';

export function ThemeToggle() {
  const [dark, setDark] = useState<boolean>(() => {
    if (typeof document === 'undefined') return false;
    return document.documentElement.classList.contains('dark');
  });

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light');
    } catch {
      // Storage unavailable
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      className={clsx(
        'rounded-full p-2 text-on-surface-variant transition-colors',
        'hover:bg-surface-container-low hover:text-on-surface',
      )}
    >
      <Icon name={dark ? 'light_mode' : 'dark_mode'} size={20} />
    </button>
  );
}
