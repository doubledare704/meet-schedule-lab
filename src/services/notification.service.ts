import { db } from '@/lib/db';
import { getNotifyBeforeMinutes } from '@/utils/notification';
import { getWallClockTime, getOfficeTimezone, formatMinutes } from '@/utils/timezone';
import type { Notification } from '@prisma/client';
import { Prisma } from '@prisma/client';

function isUniqueConstraintViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
  );
}

export async function checkBookingExpirations(): Promise<Notification[]> {
  const now = new Date();
  const notifyBeforeMinutes = getNotifyBeforeMinutes();
  const windowEnd = new Date(now.getTime() + notifyBeforeMinutes * 60000);

  const created: Notification[] = [];

  const expiringBookings = await db.booking.findMany({
    where: {
      endTime: { gt: now, lte: windowEnd },
      notifications: { none: { type: 'SLOT_ENDING_SOON' } },
    },
    include: {
      room: { select: { name: true } },
    },
  });

  for (const booking of expiringBookings) {
    const nextBooking = await db.booking.findFirst({
      where: {
        roomId: booking.roomId,
        startTime: booking.endTime,
      },
      include: {
        user: { select: { name: true } },
      },
    });

    if (!nextBooking) continue;

    const minutesRemaining = Math.max(
      0,
      Math.round((booking.endTime.getTime() - now.getTime()) / 60000),
    );

    const message = `Your booking in ${booking.room.name} ends in ${minutesRemaining} minutes. The room is reserved next by ${nextBooking.user.name}.`;

    try {
      const notification = await db.notification.create({
        data: {
          userId: booking.userId,
          bookingId: booking.id,
          type: 'SLOT_ENDING_SOON',
          message,
        },
      });
      created.push(notification);
    } catch (error) {
      if (!isUniqueConstraintViolation(error)) throw error;
    }
  }

  const startingBookings = await db.booking.findMany({
    where: {
      startTime: { gt: now, lte: windowEnd },
      notifications: { none: { type: 'SLOT_STARTING_SOON' } },
    },
    include: {
      room: { select: { name: true } },
    },
  });

  for (const booking of startingBookings) {
    const minutesUntilStart = Math.max(
      0,
      Math.round((booking.startTime.getTime() - now.getTime()) / 60000),
    );

    const wallClock = getWallClockTime(booking.startTime, getOfficeTimezone());
    const startLabel = formatMinutes(wallClock.hours * 60 + wallClock.minutes);

    const message = `Your booking in ${booking.room.name} starts in ${minutesUntilStart} minutes at ${startLabel}.`;

    try {
      const notification = await db.notification.create({
        data: {
          userId: booking.userId,
          bookingId: booking.id,
          type: 'SLOT_STARTING_SOON',
          message,
        },
      });
      created.push(notification);
    } catch (error) {
      if (!isUniqueConstraintViolation(error)) throw error;
    }
  }

  return created;
}
