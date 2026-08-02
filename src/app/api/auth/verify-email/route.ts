import { NextRequest, NextResponse } from 'next/server';
import { errorResponse } from '@/lib/api-response';
import { verifyEmail } from '@/services/auth.service';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return errorResponse('Verification token is required.', 400);
  }

  const result = await verifyEmail({ token });
  if (!result.success) {
    return errorResponse(result.error, 400);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return NextResponse.redirect(`${appUrl}/schedule?verified=true`);
}
