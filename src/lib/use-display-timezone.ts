'use client';

import { useSyncExternalStore } from 'react';
import { getDisplayTimezone, getOfficeTimezone } from '@/utils/timezone';

const emptySubscribe = (): (() => void) => () => {};

export function useDisplayTimezone(): string {
  return useSyncExternalStore(
    emptySubscribe,
    getDisplayTimezone,
    getOfficeTimezone,
  );
}
