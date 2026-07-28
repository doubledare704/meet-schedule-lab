import { successResponse, errorResponse } from '@/lib/api-response';
import { getSession } from '@/lib/auth';

export async function GET() {
  const user = await getSession();
  if (!user) {
    return errorResponse('Not authenticated.', 401);
  }

  return successResponse({ user });
}
