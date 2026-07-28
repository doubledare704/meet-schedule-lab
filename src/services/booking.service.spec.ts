import { describe, it, expect } from 'vitest';
import { createBooking, findConflictingBookings } from './booking.service';

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
});
