import { describe, it, expect, beforeEach } from 'vitest';
import { getWallClockTime } from './timezone';

const ORIGINAL_TZ = process.env.TIMEZONE;

beforeEach(() => {
  process.env.TIMEZONE = ORIGINAL_TZ;
});

describe('getWallClockTime', () => {
  it('returns Kyiv summer time (UTC+3) for July date', () => {
    const date = new Date('2026-07-28T06:00:00.000Z');
    const result = getWallClockTime(date, 'Europe/Kyiv');
    expect(result).toEqual({ hours: 9, minutes: 0 });
  });

  it('returns Kyiv winter time (UTC+2) for January date', () => {
    const date = new Date('2026-01-15T07:00:00.000Z');
    const result = getWallClockTime(date, 'Europe/Kyiv');
    expect(result).toEqual({ hours: 9, minutes: 0 });
  });

  it('handles minutes correctly', () => {
    const date = new Date('2026-07-28T06:30:00.000Z');
    const result = getWallClockTime(date, 'Europe/Kyiv');
    expect(result).toEqual({ hours: 9, minutes: 30 });
  });

  it('defaults to process.env.TIMEZONE when no timezone argument given', () => {
    process.env.TIMEZONE = 'Europe/Kyiv';
    const date = new Date('2026-07-28T06:00:00.000Z');
    const result = getWallClockTime(date);
    expect(result).toEqual({ hours: 9, minutes: 0 });
  });

  it('handles custom timezone override via argument', () => {
    const date = new Date('2026-07-28T12:00:00.000Z');
    const result = getWallClockTime(date, 'America/New_York');
    expect(result).toEqual({ hours: 8, minutes: 0 });
  });

  it('falls back to UTC for invalid timezone', () => {
    const date = new Date('2026-07-28T06:00:00.000Z');
    const result = getWallClockTime(date, 'Invalid/Timezone');
    expect(result).toEqual({ hours: 6, minutes: 0 });
  });
});
