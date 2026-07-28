import { NextResponse } from 'next/server';

export type ApiResponse<T> = {
  success: boolean;
  data: T | null;
  error: string | null;
};

export function successResponse<T>(
  data: T,
  status: number = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    { success: true, data, error: null },
    { status }
  );
}

export function errorResponse(
  error: string,
  status: number = 400
): NextResponse<ApiResponse<never>> {
  return NextResponse.json(
    { success: false, data: null, error },
    { status }
  );
}
