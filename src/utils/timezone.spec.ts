import { describe, it, expect, beforeEach } from 'vitest';
import {
  getWallClockTime,
  getDateParts,
  getDayStart,
  getDayStartForCalendarDate,
  getOfficeWindow,
  officeRowIndexForLocalMinute,
  getNextOfficeSlot,
  getOfficeTimezone,
  OFFICE_SLOT_COUNT,
} from './timezone';

const ORIGINAL_TZ = process.env.TIMEZONE;
const ORIGINAL_OFFICE_TZ = process.env.OFFICE_TIMEZONE;

beforeEach(() => {
  process.env.TIMEZONE = ORIGINAL_TZ;
  process.env.OFFICE_TIMEZONE = ORIGINAL_OFFICE_TZ;
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

  it('defaults to office timezone when no timezone argument given', () => {
    process.env.OFFICE_TIMEZONE = 'Europe/Kyiv';
    const date = new Date('2026-07-28T06:00:00.000Z');
    const result = getWallClockTime(date);
    expect(result).toEqual({ hours: 9, minutes: 0 });
  });

  it('resolves office timezone from OFFICE_TIMEZONE env var', () => {
    process.env.OFFICE_TIMEZONE = 'America/New_York';
    const date = new Date('2026-07-28T12:00:00.000Z');
    expect(getWallClockTime(date)).toEqual({ hours: 8, minutes: 0 });
  });

  it('falls back to OFFICE_TIMEZONE over TIMEZONE', () => {
    process.env.OFFICE_TIMEZONE = 'Europe/Kyiv';
    process.env.TIMEZONE = 'Asia/Tokyo';
    const date = new Date('2026-07-28T06:00:00.000Z');
    expect(getWallClockTime(date)).toEqual({ hours: 9, minutes: 0 });
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

describe('getOfficeTimezone', () => {
  it('returns configured OFFICE_TIMEZONE', () => {
    process.env.OFFICE_TIMEZONE = 'Asia/Tokyo';
    expect(getOfficeTimezone()).toBe('Asia/Tokyo');
  });

  it('falls back to Europe/Kyiv when unset', () => {
    delete process.env.OFFICE_TIMEZONE;
    delete process.env.TIMEZONE;
    expect(getOfficeTimezone()).toBe('Europe/Kyiv');
  });
});

describe('getDateParts', () => {
  it('returns correct local calendar parts east of UTC', () => {
    const parts = getDateParts(new Date('2026-07-28T06:00:00.000Z'), 'Europe/Kyiv');
    expect(parts).toMatchObject({ year: 2026, month: 6, day: 28, weekday: 2 });
  });

  it('returns correct local calendar parts west of UTC', () => {
    const parts = getDateParts(new Date('2026-07-28T06:00:00.000Z'), 'America/New_York');
    expect(parts).toMatchObject({ year: 2026, month: 6, day: 28, weekday: 2 });
  });

  it('does not throw for an invalid date', () => {
    const parts = getDateParts(new Date(NaN), 'Europe/Kyiv');
    expect(parts).toEqual({ year: 0, month: 0, day: 0, weekday: 0 });
  });
});

describe('getDayStart', () => {
  it('returns Kyiv local midnight (UTC+3 summer) for an instant in that day', () => {
    const result = getDayStart(new Date('2026-07-28T12:00:00.000Z'), 'Europe/Kyiv');
    expect(result.toISOString()).toBe('2026-07-27T21:00:00.000Z');
  });

  it('returns Kyiv local midnight (UTC+2 winter) for an instant in that day', () => {
    const result = getDayStart(new Date('2026-01-15T12:00:00.000Z'), 'Europe/Kyiv');
    expect(result.toISOString()).toBe('2026-01-14T22:00:00.000Z');
  });

  it('returns New York local midnight for an instant in that day (west of UTC)', () => {
    const result = getDayStart(new Date('2026-07-28T12:00:00.000Z'), 'America/New_York');
    expect(result.toISOString()).toBe('2026-07-28T04:00:00.000Z');
  });

  it('returns Tokyo local midnight (east of UTC)', () => {
    const result = getDayStart(new Date('2026-07-28T12:00:00.000Z'), 'Asia/Tokyo');
    expect(result.toISOString()).toBe('2026-07-27T15:00:00.000Z');
  });

  it('returns local midnight of the previous day when instant is late UTC on a west-of-UTC zone', () => {
    const result = getDayStart(new Date('2026-07-28T02:00:00.000Z'), 'America/New_York');
    expect(result.toISOString()).toBe('2026-07-27T04:00:00.000Z');
  });
});

describe('getDayStartForCalendarDate', () => {
  it('resolves local midnight for a given calendar date in New York', () => {
    const result = getDayStartForCalendarDate(2026, 6, 28, 'America/New_York');
    expect(result.toISOString()).toBe('2026-07-28T04:00:00.000Z');
  });

  it('resolves local midnight for a given calendar date in Kyiv', () => {
    const result = getDayStartForCalendarDate(2026, 6, 28, 'Europe/Kyiv');
    expect(result.toISOString()).toBe('2026-07-27T21:00:00.000Z');
  });

  it('resolves winter-time local midnight in New York', () => {
    const result = getDayStartForCalendarDate(2026, 0, 15, 'America/New_York');
    expect(result.toISOString()).toBe('2026-01-15T05:00:00.000Z');
  });
});

describe('getOfficeWindow', () => {
  it('maps office hours to the same labels when display tz equals office tz', () => {
    const dayStart = getDayStartForCalendarDate(2026, 6, 28, 'Europe/Kyiv');
    const rows = getOfficeWindow(dayStart, 'Europe/Kyiv');
    expect(rows).toHaveLength(OFFICE_SLOT_COUNT);
    expect(rows[0].label).toBe('09:00');
    expect(rows[OFFICE_SLOT_COUNT - 1].label).toBe('18:30');
    expect(rows.map((r) => r.localMinute)).toEqual(
      Array.from({ length: OFFICE_SLOT_COUNT }, (_, i) => 540 + i * 30),
    );
  });

  it('shifts the office window into New York summer time (02:00-11:30)', () => {
    const dayStart = getDayStartForCalendarDate(2026, 6, 28, 'America/New_York');
    const rows = getOfficeWindow(dayStart, 'America/New_York');
    expect(rows[0].label).toBe('02:00');
    expect(rows[OFFICE_SLOT_COUNT - 1].label).toBe('11:30');
  });

  it('wraps past midnight for Tokyo summer time (15:00-00:30)', () => {
    const dayStart = getDayStartForCalendarDate(2026, 6, 28, 'Asia/Tokyo');
    const rows = getOfficeWindow(dayStart, 'Asia/Tokyo');
    expect(rows[0].label).toBe('15:00');
    expect(rows[OFFICE_SLOT_COUNT - 1].label).toBe('00:30');
    expect(rows.map((r) => r.localMinute)).toEqual(
      Array.from({ length: OFFICE_SLOT_COUNT }, (_, i) => (900 + i * 30) % 1440),
    );
  });
});

describe('officeRowIndexForLocalMinute', () => {
  const dayStart = getDayStartForCalendarDate(2026, 6, 28, 'America/New_York');
  const rows = getOfficeWindow(dayStart, 'America/New_York');

  it('maps the first window minute to row 0', () => {
    expect(officeRowIndexForLocalMinute(rows[0].localMinute, rows)).toBe(0);
  });

  it('maps the last window minute to the final row', () => {
    expect(officeRowIndexForLocalMinute(rows[OFFICE_SLOT_COUNT - 1].localMinute, rows)).toBe(
      OFFICE_SLOT_COUNT - 1,
    );
  });

  it('returns -1 for a local minute outside the window', () => {
    expect(officeRowIndexForLocalMinute(13 * 60, rows)).toBe(-1);
  });
});

describe('getNextOfficeSlot', () => {
  it('returns next 09:00 Kyiv when now is after office hours', () => {
    const now = new Date('2026-07-28T18:00:00.000Z');
    const result = getNextOfficeSlot(now);
    expect(result.toISOString()).toBe('2026-07-29T06:00:00.000Z');
  });

  it('returns 09:00 Kyiv of the same day when now is before office hours', () => {
    const now = new Date('2026-07-28T03:00:00.000Z');
    const result = getNextOfficeSlot(now);
    expect(result.toISOString()).toBe('2026-07-28T06:00:00.000Z');
  });

  it('returns the next 30-minute boundary within office hours', () => {
    const now = new Date('2026-07-28T06:00:00.000Z');
    const result = getNextOfficeSlot(now);
    expect(result.toISOString()).toBe('2026-07-28T06:30:00.000Z');
  });

  it('stays within office hours for a mid-day now', () => {
    const now = new Date('2026-07-28T10:00:00.000Z');
    const result = getNextOfficeSlot(now);
    expect(result.toISOString()).toBe('2026-07-28T10:30:00.000Z');
  });
});
