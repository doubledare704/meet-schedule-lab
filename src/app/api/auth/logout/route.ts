import { successResponse } from '@/lib/api-response';
import { clearSessionCookie } from '@/lib/auth';

export async function POST() {
  await clearSessionCookie();
  return successResponse({ success: true });
}
