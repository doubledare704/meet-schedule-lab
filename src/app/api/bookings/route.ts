import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-response';
import { getSession } from '@/lib/auth';
import { createBooking } from '@/services/booking.service';

const createBookingSchema = z.object({
  roomId: z.string().min(1, 'Room ID is required'),
  title: z.string().trim().min(1, 'Booking title is required').max(100, 'Booking title must be at most 100 characters'),
  startTime: z.string().datetime({ message: 'Invalid start time format' }),
  endTime: z.string().datetime({ message: 'Invalid end time format' }),
});

export async function GET(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return errorResponse('Authentication required', 401);
  }

  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');
    const date = searchParams.get('date');
    const mine = searchParams.get('mine');

    const where: Record<string, unknown> = {};

    if (mine === 'true') {
      where.userId = user.id;
    }

    if (roomId) {
      where.roomId = roomId;
    }

    if (date) {
      const dayStart = new Date(date);
      if (Number.isNaN(dayStart.getTime())) {
        return errorResponse('Invalid date format', 400);
      }

      const dayEnd = new Date(dayStart);
      dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

      where.startTime = { gte: dayStart };
      where.endTime = { lt: dayEnd };
    }

    const bookings = await db.booking.findMany({
      where,
      include: {
        room: { select: { id: true, name: true } },
        user: { select: { id: true, name: true } },
      },
      orderBy: { startTime: 'asc' },
    });

    return successResponse(bookings);
  } catch {
    return errorResponse('Failed to fetch bookings', 500);
  }
}

export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return errorResponse('Authentication required', 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON body', 400);
  }

  const parsed = createBookingSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message || 'Validation failed';
    return errorResponse(firstError, 400);
  }

  const startTime = new Date(parsed.data.startTime);
  const endTime = new Date(parsed.data.endTime);

  if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
    return errorResponse('Invalid date values', 400);
  }

  const result = await createBooking({
    roomId: parsed.data.roomId,
    userId: user.id,
    title: parsed.data.title,
    startTime,
    endTime,
  });

  if (!result.success) {
    return errorResponse(result.error, 409);
  }

  return successResponse({ booking: result.booking }, 201);
}
