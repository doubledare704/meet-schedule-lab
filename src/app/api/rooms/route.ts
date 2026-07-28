import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const capacityParam = searchParams.get('capacity');

    const where: Record<string, unknown> = {};
    if (capacityParam !== null) {
      const capacity = parseInt(capacityParam, 10);
      if (Number.isNaN(capacity) || capacity < 1) {
        return errorResponse('Invalid capacity filter', 400);
      }
      where.capacity = { gte: capacity };
    }

    const rooms = await db.room.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    return successResponse(rooms);
  } catch {
    return errorResponse('Failed to fetch rooms', 500);
  }
}
