import { NextRequest } from 'next/server';
import { z } from 'zod';
import { successResponse, errorResponse } from '@/lib/api-response';
import { getSession } from '@/lib/auth';
import { createRecurringSeries } from '@/services/booking.service';

const createRecurringSchema = z.object({
  roomId: z.string().min(1, 'Room ID is required'),
  title: z.string().trim().min(1, 'Booking title is required').max(100, 'Booking title must be at most 100 characters'),
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Start time must be in HH:MM format'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'End time must be in HH:MM format'),
  startDate: z.string().datetime({ message: 'Invalid start date format' }),
  untilDate: z.string().datetime({ message: 'Invalid until date format' }),
});

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

  const parsed = createRecurringSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message || 'Validation failed';
    return errorResponse(firstError, 400);
  }

  const startDate = new Date(parsed.data.startDate);
  const untilDate = new Date(parsed.data.untilDate);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(untilDate.getTime())) {
    return errorResponse('Invalid date values', 400);
  }

  const result = await createRecurringSeries({
    roomId: parsed.data.roomId,
    userId: user.id,
    title: parsed.data.title,
    dayOfWeek: parsed.data.dayOfWeek,
    startTime: parsed.data.startTime,
    endTime: parsed.data.endTime,
    startDate,
    untilDate,
  });

  if (!result.success) {
    return errorResponse(result.error, result.status ?? 409);
  }

  return successResponse(
    {
      series: result.series,
      created: result.created,
      skipped: result.skipped,
    },
    201,
  );
}
