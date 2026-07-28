import { describe, it, expect } from 'vitest';
import { hasIntervalOverlap, validateBookingRules } from './overlap';
import { fixedNow, createDate, createInterval, addDays } from './test-utils';

describe('hasIntervalOverlap', () => {
  it('detects direct overlapping intervals', () => {
    const a = createInterval(9, 0, 11, 0);
    const b = createInterval(10, 0, 12, 0);
    expect(hasIntervalOverlap(a, b)).toBe(true);
    expect(hasIntervalOverlap(b, a)).toBe(true);
  });

  it('detects complete enclosure', () => {
    const a = createInterval(9, 0, 17, 0);
    const b = createInterval(10, 0, 11, 0);
    expect(hasIntervalOverlap(a, b)).toBe(true);
    expect(hasIntervalOverlap(b, a)).toBe(true);
  });

  it('returns false for non-overlapping intervals with a gap', () => {
    const a = createInterval(9, 0, 10, 0);
    const b = createInterval(11, 0, 12, 0);
    expect(hasIntervalOverlap(a, b)).toBe(false);
    expect(hasIntervalOverlap(b, a)).toBe(false);
  });

  it('returns false for abutting adjacent slots', () => {
    const a = createInterval(9, 0, 10, 0);
    const b = createInterval(10, 0, 11, 0);
    expect(hasIntervalOverlap(a, b)).toBe(false);
    expect(hasIntervalOverlap(b, a)).toBe(false);
  });

  it('returns true for identical intervals', () => {
    const a = createInterval(9, 0, 10, 0);
    const b = createInterval(9, 0, 10, 0);
    expect(hasIntervalOverlap(a, b)).toBe(true);
  });

  it('detects conflict among multiple existing intervals', () => {
    const existing = [
      createInterval(9, 0, 10, 30),
      createInterval(11, 0, 12, 0),
      createInterval(13, 0, 14, 0),
    ];
    const incoming = createInterval(10, 0, 11, 0);
    const hasConflict = existing.some((i) => hasIntervalOverlap(incoming, i));
    expect(hasConflict).toBe(true);
  });
});

describe('validateBookingRules', () => {
  it('rejects past bookings where startTime is before now', () => {
    const result = validateBookingRules(
      { startTime: createDate(5, 0), endTime: createDate(6, 0) },
      fixedNow,
    );
    expect(result.isValid).toBe(false);
  });

  it('rejects non-30-minute alignment', () => {
    const result = validateBookingRules(
      { startTime: createDate(9, 15), endTime: createDate(10, 45) },
      fixedNow,
    );
    expect(result.isValid).toBe(false);
  });

  it('rejects duration below 30 minutes', () => {
    const result = validateBookingRules(
      { startTime: createDate(9, 0), endTime: createDate(9, 10) },
      fixedNow,
    );
    expect(result.isValid).toBe(false);
  });

  it('rejects duration exceeding 4 hours', () => {
    const result = validateBookingRules(
      { startTime: createDate(9, 0), endTime: createDate(14, 0) },
      fixedNow,
    );
    expect(result.isValid).toBe(false);
  });

  it('passes when start is exactly 09:00 Kyiv (06:00 UTC)', () => {
    const result = validateBookingRules(
      { startTime: addDays(createDate(6, 0), 1), endTime: addDays(createDate(7, 0), 1) },
      fixedNow,
    );
    expect(result.isValid).toBe(true);
  });

  it('rejects start before 09:00 Kyiv (before 06:00 UTC)', () => {
    const result = validateBookingRules(
      { startTime: addDays(createDate(5, 0), 1), endTime: addDays(createDate(6, 0), 1) },
      fixedNow,
    );
    expect(result.isValid).toBe(false);
  });

  it('passes when end is exactly 19:00 Kyiv (16:00 UTC)', () => {
    const result = validateBookingRules(
      { startTime: addDays(createDate(15, 0), 1), endTime: addDays(createDate(16, 0), 1) },
      fixedNow,
    );
    expect(result.isValid).toBe(true);
  });

  it('rejects end after 19:00 Kyiv (after 16:00 UTC)', () => {
    const result = validateBookingRules(
      { startTime: addDays(createDate(15, 30), 1), endTime: addDays(createDate(16, 30), 1) },
      fixedNow,
    );
    expect(result.isValid).toBe(false);
  });

  it('rejects bookings beyond 60-day horizon', () => {
    const farStart = new Date(fixedNow);
    farStart.setUTCDate(farStart.getUTCDate() + 61);
    farStart.setUTCHours(9, 0, 0, 0);
    const farEnd = new Date(farStart);
    farEnd.setUTCHours(10, 0, 0, 0);

    const result = validateBookingRules(
      { startTime: farStart, endTime: farEnd },
      fixedNow,
    );
    expect(result.isValid).toBe(false);
  });

  it('rejects end time before start time', () => {
    const result = validateBookingRules(
      { startTime: createDate(10, 0), endTime: createDate(9, 0) },
      fixedNow,
    );
    expect(result.isValid).toBe(false);
  });

  it('passes valid 1-hour booking within office hours', () => {
    const result = validateBookingRules(
      { startTime: createDate(9, 0), endTime: createDate(10, 0) },
      fixedNow,
    );
    expect(result.isValid).toBe(true);
  });
});
