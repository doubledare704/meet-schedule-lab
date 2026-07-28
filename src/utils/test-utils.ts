import type { TimeInterval } from './types';

export const fixedNow = new Date('2026-07-28T06:00:00.000Z');

export function createDate(hours: number, minutes: number = 0): Date {
  const date = new Date(fixedNow);
  date.setUTCHours(hours, minutes, 0, 0);
  return date;
}

export function createInterval(
  startHour: number,
  startMin: number,
  endHour: number,
  endMin: number,
): TimeInterval {
  return {
    start: createDate(startHour, startMin),
    end: createDate(endHour, endMin),
  };
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}
