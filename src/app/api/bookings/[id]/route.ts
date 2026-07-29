import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-response';
import { getSession } from '@/lib/auth';
import { cancelBooking, cancelFutureInSeries } from '@/services/booking.service';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSession();
  if (!user) {
    return errorResponse('Authentication required', 401);
  }

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const scope = searchParams.get('scope') ?? 'this';

  if (scope === 'future') {
    const result = await cancelFutureInSeries(id, user.id);
    if (!result.success) {
      return errorResponse(result.error, 400);
    }
    return successResponse({ cancelledCount: result.cancelledCount });
  }

  const result = await cancelBooking(id, user.id);
  if (!result.success) {
    return errorResponse(result.error, 400);
  }

  return successResponse({ cancelled: true });
}
