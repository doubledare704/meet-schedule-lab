import type { TimeInterval, BookingRuleInput, ValidationResult } from './types';

export function hasIntervalOverlap(a: TimeInterval, b: TimeInterval): boolean {
  return Math.max(a.start.getTime(), b.start.getTime()) < Math.min(a.end.getTime(), b.end.getTime());
}

export function validateBookingRules(
  input: BookingRuleInput,
  now?: Date,
): ValidationResult {
  const nowDate = now ?? new Date();
  const startMs = input.startTime.getTime();
  const endMs = input.endTime.getTime();

  if (endMs <= startMs) {
    return { isValid: false, error: 'End time must be after start time' };
  }

  if (startMs <= nowDate.getTime()) {
    return { isValid: false, error: 'Cannot book in the past' };
  }

  const startMinOfDay =
    input.startTime.getUTCHours() * 60 + input.startTime.getUTCMinutes();
  const endMinOfDay =
    input.endTime.getUTCHours() * 60 + input.endTime.getUTCMinutes();

  if (startMinOfDay % 30 !== 0 || endMinOfDay % 30 !== 0) {
    return { isValid: false, error: 'Times must align to 30-minute increments' };
  }

  const durationMs = endMs - startMs;
  if (durationMs < 30 * 60 * 1000) {
    return { isValid: false, error: 'Minimum booking duration is 30 minutes' };
  }

  if (durationMs > 4 * 60 * 60 * 1000) {
    return { isValid: false, error: 'Maximum booking duration is 4 hours' };
  }

  if (startMinOfDay < 9 * 60) {
    return { isValid: false, error: 'Booking must start at or after 09:00' };
  }

  if (endMinOfDay > 19 * 60) {
    return { isValid: false, error: 'Booking must end at or before 19:00' };
  }

  const maxAdvanceMs = 60 * 24 * 60 * 60 * 1000;
  if (startMs - nowDate.getTime() > maxAdvanceMs) {
    return { isValid: false, error: 'Cannot book more than 60 days in advance' };
  }

  return { isValid: true };
}
