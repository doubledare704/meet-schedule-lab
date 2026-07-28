import { NextRequest } from 'next/server';
import { z } from 'zod';
import { successResponse, errorResponse } from '@/lib/api-response';
import { setSessionCookie } from '@/lib/auth';
import { loginUser } from '@/services/auth.service';

const loginSchema = z.object({
  email: z.string().email().transform((v) => v.trim().toLowerCase()),
  password: z.string().min(1, 'Password is required.'),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON body.', 400);
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message || 'Validation failed.';
    return errorResponse(firstError, 400);
  }

  const result = await loginUser(parsed.data);
  if (!result.success) {
    return errorResponse(result.error, 401);
  }

  await setSessionCookie(result.user.id);

  return successResponse({ user: result.user });
}
