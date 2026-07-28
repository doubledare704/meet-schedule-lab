import { NextRequest } from 'next/server';
import { z } from 'zod';
import { successResponse, errorResponse } from '@/lib/api-response';
import { setSessionCookie } from '@/lib/auth';
import { registerUser } from '@/services/auth.service';

const registerSchema = z.object({
  email: z.string().email().transform((v) => v.trim().toLowerCase()),
  name: z.string().min(1, 'Name is required.').max(100),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .max(72, 'Password must not exceed 72 characters.'),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON body.', 400);
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message || 'Validation failed.';
    return errorResponse(firstError, 400);
  }

  const result = await registerUser(parsed.data);
  if (!result.success) {
    return errorResponse(result.error, 409);
  }

  await setSessionCookie(result.user.id);

  return successResponse({ user: result.user }, 201);
}
