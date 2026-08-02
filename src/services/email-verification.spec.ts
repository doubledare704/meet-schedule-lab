import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { registerUser } from './auth.service';
import { createBooking, createRecurringSeries } from './booking.service';
import { GET as verifyEmailRoute } from '@/app/api/auth/verify-email/route';
import { db } from '@/lib/db';
import { getKyivDayStart } from '@/utils/timezone';

const UNVERIFIED_EMAIL = 'email-verification@example.com';
const VERIFICATION_ROOM_ID = '00000000-0000-0000-0000-000000000020';

let userId: string | null = null;
let verificationToken: string | null = null;

function makeVerifyRequest(url: string): NextRequest {
  return new NextRequest(new Request(new URL(url, 'http://localhost')));
}

function kyivDate(daysFromNow: number, kyivHour: number): Date {
  const now = new Date();
  const targetDate = new Date(now.getTime() + daysFromNow * 86400000);
  const dayStart = getKyivDayStart(targetDate);
  return new Date(dayStart.getTime() + kyivHour * 3600000);
}

beforeAll(async () => {
  await db.room.create({
    data: {
      id: VERIFICATION_ROOM_ID,
      name: 'Email Verification Room',
      floor: 3,
      capacity: 4,
    },
  });
});

afterAll(async () => {
  if (userId) {
    await db.booking.deleteMany({ where: { userId } });
    await db.recurringSeries.deleteMany({ where: { userId } });
    await db.user.deleteMany({ where: { id: userId } });
  }
  await db.room.deleteMany({ where: { id: VERIFICATION_ROOM_ID } });
});

describe('dev-mode email verification', () => {
  it('registers a new account unverified and prints the verification link', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const result = await registerUser({
      email: UNVERIFIED_EMAIL,
      name: 'Unverified User',
      password: 'password123',
    });

    expect(result.success).toBe(true);
    userId = result.success ? result.user.id : null;

    const user = await db.user.findUnique({
      where: { email: UNVERIFIED_EMAIL },
    });
    expect(user?.isEmailVerified).toBe(false);
    expect(user?.emailVerificationToken).toBeTruthy();
    verificationToken = user?.emailVerificationToken ?? null;

    const logged = logSpy.mock.calls.map((call) => call.join(' ')).join('\n');
    expect(logged).toContain('[DEV EMAIL VERIFICATION LINK]:');
    expect(logged).toContain(`/api/auth/verify-email?token=${verificationToken}`);

    logSpy.mockRestore();
  });

  it('blocks an unverified account from creating bookings with 403', async () => {
    expect(userId).toBeTruthy();

    const single = await createBooking({
      roomId: VERIFICATION_ROOM_ID,
      userId: userId ?? '',
      title: 'Blocked booking',
      startTime: kyivDate(9, 10),
      endTime: kyivDate(9, 11),
    });
    expect(single.success).toBe(false);
    if (!single.success) {
      expect(single.status).toBe(403);
      expect(single.error).toBe('Email must be verified before making bookings.');
    }

    const series = await createRecurringSeries({
      roomId: VERIFICATION_ROOM_ID,
      userId: userId ?? '',
      title: 'Blocked series',
      dayOfWeek: 1,
      startTime: '10:00',
      endTime: '11:00',
      startDate: kyivDate(11, 10),
      untilDate: new Date(kyivDate(11, 10).getTime() + 7 * 86400000),
    });
    expect(series.success).toBe(false);
    if (!series.success) {
      expect(series.status).toBe(403);
    }
  });

  it('verifies the account through the verification route', async () => {
    expect(verificationToken).toBeTruthy();

    const res = await verifyEmailRoute(
      makeVerifyRequest(`/api/auth/verify-email?token=${verificationToken}`),
    );
    expect(res.status).toBe(307);

    const user = await db.user.findUnique({
      where: { email: UNVERIFIED_EMAIL },
    });
    expect(user?.isEmailVerified).toBe(true);
    expect(user?.emailVerificationToken).toBeNull();
  });

  it('allows the verified account to create a booking', async () => {
    const result = await createBooking({
      roomId: VERIFICATION_ROOM_ID,
      userId: userId ?? '',
      title: 'Verified booking',
      startTime: kyivDate(10, 10),
      endTime: kyivDate(10, 11),
    });
    expect(result.success).toBe(true);
  });
});
