import { db } from '@/lib/db';
import { validateBookingRules } from '@/utils/overlap';
import { getKyivDayStart } from '@/utils/timezone';
import type { Booking, RecurringSeries } from '@prisma/client';

const MAX_RECURRING_INSTANCES = 52;
const TZ = 'Europe/Kyiv';

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
      await tx.$executeRawUnsafe(
        `SELECT pg_advisory_xact_lock(('x' || left(md5($1::text), 15))::bit(60)::bigint)`,
        input.roomId,
      );

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

function combineDateAndTime(date: Date, timeStr: string): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const kyivMidnight = getKyivDayStart(date);
  return new Date(kyivMidnight.getTime() + hours * 3600000 + minutes * 60000);
}

export async function cancelBooking(
  id: string,
  userId: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const booking = await db.booking.findUnique({ where: { id } });

    if (!booking) {
      return { success: false, error: 'Booking not found' };
    }

    if (booking.userId !== userId) {
      return { success: false, error: 'Not authorized to cancel this booking' };
    }

    if (new Date(booking.startTime) <= new Date()) {
      return { success: false, error: 'Cannot cancel a past booking' };
    }

    await db.booking.delete({ where: { id } });

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to cancel booking';
    return { success: false, error: message };
  }
}

export async function cancelFutureInSeries(
  bookingId: string,
  userId: string,
): Promise<{ success: true; cancelledCount: number } | { success: false; error: string }> {
  try {
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: { recurringSeries: true },
    });

    if (!booking) {
      return { success: false, error: 'Booking not found' };
    }

    if (booking.userId !== userId) {
      return { success: false, error: 'Not authorized to cancel this booking' };
    }

    if (!booking.recurringSeriesId) {
      return { success: false, error: 'Booking is not part of a recurring series' };
    }

    const now = new Date();
    const seriesId = booking.recurringSeriesId;

    if (new Date(booking.startTime) <= now) {
      return { success: false, error: 'Cannot cancel past bookings in a series' };
    }

    const result = await db.$transaction(async (tx) => {
      const futureBookings = await tx.booking.findMany({
        where: {
          recurringSeriesId: seriesId,
          startTime: { gte: now },
        },
      });

      if (futureBookings.length === 0) {
        return 0;
      }

      await tx.booking.deleteMany({
        where: {
          recurringSeriesId: seriesId,
          startTime: { gte: now },
        },
      });

      await tx.recurringSeries.update({
        where: { id: seriesId },
        data: { untilDate: now },
      });

      return futureBookings.length;
    });

    return { success: true, cancelledCount: result };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to cancel future bookings';
    return { success: false, error: message };
  }
}

export async function createRecurringSeries(input: {
  roomId: string;
  userId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  startDate: Date;
  untilDate: Date;
}): Promise<
  | {
      success: true;
      series: RecurringSeries;
      created: Booking[];
      skipped: Array<{ date: string; reason: string }>;
    }
  | { success: false; error: string }
> {
  const firstStart = combineDateAndTime(input.startDate, input.startTime);
  const firstEnd = combineDateAndTime(input.startDate, input.endTime);

  const validation = validateBookingRules({
    startTime: firstStart,
    endTime: firstEnd,
  });

  if (!validation.isValid) {
    return { success: false, error: validation.error ?? 'Invalid booking time' };
  }

  if (input.dayOfWeek < 0 || input.dayOfWeek > 6) {
    return { success: false, error: 'Invalid day of week' };
  }

  if (input.untilDate <= input.startDate) {
    return { success: false, error: 'Until date must be after start date' };
  }

  const maxUntil = new Date(input.startDate);
  maxUntil.setFullYear(maxUntil.getFullYear() + 1);
  if (input.untilDate > maxUntil) {
    return { success: false, error: 'Recurring series cannot exceed 1 year' };
  }

  try {
    const result = await db.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(
        `SELECT pg_advisory_xact_lock(('x' || left(md5($1::text), 15))::bit(60)::bigint)`,
        input.roomId,
      );

      const series = await tx.recurringSeries.create({
        data: {
          userId: input.userId,
          dayOfWeek: input.dayOfWeek,
          startTime: input.startTime,
          endTime: input.endTime,
          untilDate: input.untilDate,
        },
      });

      const rangeStart = combineDateAndTime(input.startDate, input.startTime);
      const rangeEnd = combineDateAndTime(input.untilDate, input.endTime);

      await tx.$queryRawUnsafe(
        `SELECT id FROM "bookings" WHERE "roomId" = $1 AND "startTime" < $2 AND "endTime" > $3 FOR UPDATE`,
        input.roomId,
        rangeEnd,
        rangeStart,
      );

      const created: Booking[] = [];
      const skipped: Array<{ date: string; reason: string }> = [];
      let instanceCount = 0;

      const currentDate = new Date(input.startDate);

      while (currentDate <= input.untilDate && instanceCount < MAX_RECURRING_INSTANCES) {
        const startUTC = combineDateAndTime(currentDate, input.startTime);
        const endUTC = combineDateAndTime(currentDate, input.endTime);

        const conflicts = await tx.booking.findMany({
          where: {
            roomId: input.roomId,
            startTime: { lt: endUTC },
            endTime: { gt: startUTC },
          },
        });

        if (conflicts.length > 0) {
          skipped.push({
            date: currentDate.toISOString().split('T')[0],
            reason: 'Time slot conflict',
          });
        } else {
          const booking = await tx.booking.create({
            data: {
              roomId: input.roomId,
              userId: input.userId,
              startTime: startUTC,
              endTime: endUTC,
              recurringSeriesId: series.id,
            },
          });
          created.push(booking);
        }

        instanceCount++;
        currentDate.setDate(currentDate.getDate() + 7);
      }

      return { series, created, skipped };
    });

    return { success: true, ...result };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create recurring series';
    return { success: false, error: message };
  }
}
