import { db } from '@/lib/db';
import { validateBookingRules } from '@/utils/overlap';
import type { Booking } from '@prisma/client';

export async function createBooking(input: {
  roomId: string;
  userId: string;
  startTime: Date;
  endTime: Date;
}): Promise<{ success: true; booking: Booking } | { success: false; error: string }> {
  const validation = validateBookingRules({
    startTime: input.startTime,
    endTime: input.endTime,
  });

  if (!validation.isValid) {
    return { success: false, error: validation.error ?? 'Invalid booking' };
  }

  try {
    const result = await db.$transaction(async (tx) => {
      await tx.$queryRawUnsafe(
        `SELECT id FROM "bookings" WHERE "roomId" = $1 AND "startTime" < $2 AND "endTime" > $3 FOR UPDATE`,
        input.roomId,
        input.endTime,
        input.startTime,
      );

      const conflicts = await tx.booking.findMany({
        where: {
          roomId: input.roomId,
          startTime: { lt: input.endTime },
          endTime: { gt: input.startTime },
        },
      });

      if (conflicts.length > 0) {
        throw new Error('Time slot conflicts with an existing booking');
      }

      return tx.booking.create({
        data: {
          roomId: input.roomId,
          userId: input.userId,
          startTime: input.startTime,
          endTime: input.endTime,
        },
      });
    });

    return { success: true, booking: result };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create booking';
    return { success: false, error: message };
  }
}

export async function findConflictingBookings(
  roomId: string,
  startTime: Date,
  endTime: Date,
): Promise<Booking[]> {
  try {
    return await db.booking.findMany({
      where: {
        roomId,
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
    });
  } catch {
    return [];
  }
}
