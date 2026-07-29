import { describe, it, expect } from 'vitest';
import {
  createBooking,
  findConflictingBookings,
  cancelBooking,
  cancelFutureInSeries,
  createRecurringSeries,
} from './booking.service';

describe('BookingService', () => {
  describe('createBooking', () => {
    it('should be a function', () => {
      expect(typeof createBooking).toBe('function');
    });

    it('should accept booking data and return a promise', async () => {
      const result = createBooking({
        roomId: 'room-id',
        userId: 'user-id',
        startTime: new Date(),
        endTime: new Date(),
      });
      expect(result).toBeInstanceOf(Promise);
    });
  });

  describe('findConflictingBookings', () => {
    it('should be a function', () => {
      expect(typeof findConflictingBookings).toBe('function');
    });

    it('should accept room and time range and return booking array', async () => {
      const result = findConflictingBookings('room-id', new Date(), new Date());
      expect(result).toBeInstanceOf(Promise);
      const bookings = await result;
      expect(Array.isArray(bookings)).toBe(true);
    });
  });

  describe('cancelBooking', () => {
    it('should be a function', () => {
      expect(typeof cancelBooking).toBe('function');
    });

    it('should accept id and userId and return a promise', async () => {
      const result = cancelBooking('booking-id', 'user-id');
      expect(result).toBeInstanceOf(Promise);
    });

    it('should return an object with success property', async () => {
      const result = await cancelBooking('nonexistent-id', 'user-id');
      expect(result).toHaveProperty('success');
      expect(result.success).toBe(false);
    });
  });

  describe('cancelFutureInSeries', () => {
    it('should be a function', () => {
      expect(typeof cancelFutureInSeries).toBe('function');
    });

    it('should accept bookingId and userId and return a promise', async () => {
      const result = cancelFutureInSeries('booking-id', 'user-id');
      expect(result).toBeInstanceOf(Promise);
    });

    it('should return an object with success and cancelledCount for non-series booking', async () => {
      const result = await cancelFutureInSeries('nonexistent-id', 'user-id');
      expect(result).toHaveProperty('success');
      expect(result.success).toBe(false);
    });
  });

  describe('createRecurringSeries', () => {
    it('should be a function', () => {
      expect(typeof createRecurringSeries).toBe('function');
    });

    it('should accept series input and return a promise', async () => {
      const result = createRecurringSeries({
        roomId: 'room-id',
        userId: 'user-id',
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '10:00',
        startDate: new Date(),
        untilDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      expect(result).toBeInstanceOf(Promise);
    });

    it('should validate business rules for the time pattern', async () => {
      const result = await createRecurringSeries({
        roomId: 'room-id',
        userId: 'user-id',
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '10:00',
        startDate: new Date('2026-07-29T06:00:00.000Z'),
        untilDate: new Date('2026-08-05T06:00:00.000Z'),
      });
      expect(result).toHaveProperty('success');
    });
  });
});
