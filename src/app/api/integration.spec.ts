import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getBookings, POST as createBooking } from './bookings/route';
import { DELETE as cancelBooking } from './bookings/[id]/route';
import { POST as createRecurring } from './bookings/recurring/route';
import { GET as getRooms } from './rooms/route';
import { GET as getSse } from './notifications/sse/route';
import {
  TEST_USER,
  TEST_ROOM_ID,
  seedTestData,
  cleanupTestData,
} from '@/test-utils/integration';
import { db } from '@/lib/db';
import { getKyivDayStart } from '@/utils/timezone';

vi.mock('@/lib/auth', () => ({
  getSession: vi.fn(() => Promise.resolve({ id: TEST_USER.id, email: TEST_USER.email, name: TEST_USER.name })),
}));

function makeRequest(url: string, init?: Record<string, unknown>): NextRequest {
  return new NextRequest(new Request(new URL(url, 'http://localhost'), init as RequestInit));
}

function kyivDate(daysFromNow: number, kyivHour: number, kyivMinute: number = 0): Date {
  const now = new Date();
  const targetDate = new Date(now.getTime() + daysFromNow * 86400000);
  const dayStart = getKyivDayStart(targetDate);
  return new Date(dayStart.getTime() + kyivHour * 3600000 + kyivMinute * 60000);
}

beforeAll(async () => {
  await seedTestData();
});

afterAll(async () => {
  await cleanupTestData();
});

describe('GET /api/rooms', () => {
  it('should return all rooms', async () => {
    const res = await getRooms(makeRequest('/api/rooms'));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.data.length).toBeGreaterThanOrEqual(2);
  });

  it('should filter by capacity', async () => {
    const res = await getRooms(makeRequest('/api/rooms?capacity=8'));
    const body = await res.json();
    expect(body.data.every((r: { capacity: number }) => r.capacity >= 8)).toBe(true);
  });

  it('should reject invalid capacity filter', async () => {
    const res = await getRooms(makeRequest('/api/rooms?capacity=abc'));
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
  });
});

describe('GET /api/bookings', () => {
  it('should return empty list when none exist', async () => {
    const res = await getBookings(makeRequest('/api/bookings'));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('should filter by mine=true', async () => {
    const booking = await db.booking.create({
      data: { roomId: TEST_ROOM_ID, userId: TEST_USER.id, startTime: kyivDate(2, 10), endTime: kyivDate(2, 11) },
    });
    const res = await getBookings(makeRequest('/api/bookings?mine=true'));
    const body = await res.json();
    expect(body.data.some((b: { id: string }) => b.id === booking.id)).toBe(true);
    await db.booking.delete({ where: { id: booking.id } });
  });

  it('should filter by roomId', async () => {
    const booking = await db.booking.create({
      data: { roomId: TEST_ROOM_ID, userId: TEST_USER.id, startTime: kyivDate(2, 10), endTime: kyivDate(2, 11) },
    });
    const res = await getBookings(makeRequest(`/api/bookings?roomId=${TEST_ROOM_ID}`));
    const body = await res.json();
    expect(body.data.every((b: { roomId: string }) => b.roomId === TEST_ROOM_ID)).toBe(true);
    await db.booking.delete({ where: { id: booking.id } });
  });
});

describe('POST /api/bookings', () => {
  it('should create a booking', async () => {
    const start = kyivDate(3, 10);
    const end = kyivDate(3, 11);
    const res = await createBooking(makeRequest('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId: TEST_ROOM_ID, title: 'Test booking', startTime: start.toISOString(), endTime: end.toISOString() }),
    }));
    const body = await res.json();
    expect(res.status).toBe(201);
    expect(body.data.booking.roomId).toBe(TEST_ROOM_ID);
    await db.booking.delete({ where: { id: body.data.booking.id } });
  });

  it('should reject missing roomId', async () => {
    const start = kyivDate(3, 10);
    const end = kyivDate(3, 11);
    const res = await createBooking(makeRequest('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startTime: start.toISOString(), endTime: end.toISOString() }),
    }));
    expect(res.status).toBe(400);
  });

  it('should reject past dates', async () => {
    const res = await createBooking(makeRequest('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId: TEST_ROOM_ID, title: 'Test booking', startTime: new Date('2020-01-01').toISOString(), endTime: new Date('2020-01-01T01:00:00').toISOString() }),
    }));
    expect(res.status).toBe(409);
  });

  it('should detect conflicts', async () => {
    const start = kyivDate(4, 10);
    const end = kyivDate(4, 11);
    const existing = await db.booking.create({
      data: { roomId: TEST_ROOM_ID, userId: TEST_USER.id, startTime: start, endTime: end },
    });
    const res = await createBooking(makeRequest('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId: TEST_ROOM_ID, title: 'Test booking', startTime: start.toISOString(), endTime: end.toISOString() }),
    }));
    expect(res.status).toBe(409);
    await db.booking.delete({ where: { id: existing.id } });
  });
});

describe('DELETE /api/bookings/[id]', () => {
  it('should cancel own booking', async () => {
    const booking = await db.booking.create({
      data: { roomId: TEST_ROOM_ID, userId: TEST_USER.id, startTime: kyivDate(5, 10), endTime: kyivDate(5, 11) },
    });
    const res = await cancelBooking(makeRequest(`/api/bookings/${booking.id}`), { params: Promise.resolve({ id: booking.id }) });
    expect(res.status).toBe(200);
    expect(await db.booking.findUnique({ where: { id: booking.id } })).toBeNull();
  });

  it('should reject non-existent', async () => {
    const res = await cancelBooking(makeRequest('/api/bookings/nonexistent'), { params: Promise.resolve({ id: 'nonexistent' }) });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/bookings/recurring', () => {
  it('should create a recurring series', async () => {
    const startDate = kyivDate(6, 10);
    const res = await createRecurring(makeRequest('/api/bookings/recurring', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId: TEST_ROOM_ID,
        title: 'Weekly sync',
        dayOfWeek: startDate.getUTCDay(),
        startTime: '10:00',
        endTime: '11:00',
        startDate: startDate.toISOString(),
        untilDate: new Date(startDate.getTime() + 21 * 86400000).toISOString(),
      }),
    }));
    const body = await res.json();
    expect(res.status).toBe(201);
    expect(body.data.created.length).toBeGreaterThanOrEqual(1);
    await db.booking.deleteMany({ where: { recurringSeriesId: body.data.series.id } });
    await db.recurringSeries.delete({ where: { id: body.data.series.id } });
  });

  it('should skip conflicting slots', async () => {
    const startDate = kyivDate(7, 10);
    const conflict = await db.booking.create({
      data: { roomId: TEST_ROOM_ID, userId: TEST_USER.id, startTime: startDate, endTime: new Date(startDate.getTime() + 3600000) },
    });
    const res = await createRecurring(makeRequest('/api/bookings/recurring', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId: TEST_ROOM_ID,
        title: 'Weekly sync',
        dayOfWeek: startDate.getUTCDay(),
        startTime: '10:00',
        endTime: '11:00',
        startDate: startDate.toISOString(),
        untilDate: new Date(startDate.getTime() + 14 * 86400000).toISOString(),
      }),
    }));
    const body = await res.json();
    expect(res.status).toBe(201);
    expect(body.data.skipped.length).toBeGreaterThanOrEqual(1);
    await db.booking.deleteMany({ where: { recurringSeriesId: body.data.series.id } });
    await db.recurringSeries.delete({ where: { id: body.data.series.id } });
    await db.booking.delete({ where: { id: conflict.id } });
  });
});

describe('concurrency', () => {
  it.each([2, 4, 8])('should only allow one of %i concurrent bookings for the same slot', async (n) => {
    const start = kyivDate(20, 10);
    const end = kyivDate(20, 11);

    const makeReq = async () => {
      const res = await createBooking(makeRequest('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: TEST_ROOM_ID, title: 'Test booking', startTime: start.toISOString(), endTime: end.toISOString() }),
      }));
      return res;
    };

    const results = await Promise.allSettled(Array.from({ length: n }, () => makeReq()));

    const statuses = await Promise.all(
      results.map(async (r) => (r.status === 'fulfilled' ? r.value.status : 0)),
    );

    const successCount = statuses.filter((s) => s === 201).length;
    const conflictCount = statuses.filter((s) => s === 409).length;

    expect(successCount).toBe(1);
    expect(conflictCount).toBe(n - 1);

    const successIdx = statuses.indexOf(201);
    if (successIdx >= 0 && results[successIdx].status === 'fulfilled') {
      const body = await results[successIdx].value.json();
      if (body.data?.booking?.id) {
        await db.booking.delete({ where: { id: body.data.booking.id } });
      }
    }
  });
});

describe('GET /api/notifications/sse', () => {
  function readUntilEvent(
    reader: ReadableStreamDefaultReader<Uint8Array>,
    marker: string,
    timeoutMs = 5000,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const decoder = new TextDecoder();
      let buffer = '';
      const timer = setTimeout(() => {
        reject(new Error(`Timed out waiting for "${marker}"`));
      }, timeoutMs);

      async function pump(): Promise<void> {
        const { done, value } = await reader.read();
        if (done) {
          clearTimeout(timer);
          resolve(buffer);
          return;
        }
        buffer += decoder.decode(value, { stream: true });
        if (buffer.includes(marker)) {
          clearTimeout(timer);
          resolve(buffer);
          return;
        }
        await pump();
      }

      void pump();
    });
  }

  it('emits a well-formed single-line JSON payload for an expiring booking', async () => {
    const start = new Date(Date.now() + 3 * 60000);
    const end = new Date(start.getTime() + 30 * 60000);
    const booking = await db.booking.create({
      data: {
        roomId: TEST_ROOM_ID,
        userId: TEST_USER.id,
        title: 'SSE regression',
        startTime: start,
        endTime: end,
      },
    });

    const res = await getSse(
      new NextRequest(new Request(new URL('http://localhost/api/notifications/sse'))),
    );
    expect(res.status).toBe(200);

    const body = await readUntilEvent(res.body!.getReader(), 'booking-expiring');
    expect(body).toContain(`"bookingId":"${booking.id}"`);

    const eventBlock = body.split('\n\n').find((b) => b.includes('booking-expiring')) ?? '';
    const dataLine = eventBlock.split('\n').find((l) => l.startsWith('data: ')) ?? '';
    const json = dataLine.slice('data: '.length);
    expect(json).not.toContain('\n');
    expect(() => JSON.parse(json)).not.toThrow();
    expect(JSON.parse(json).bookingId).toBe(booking.id);

    await db.booking.delete({ where: { id: booking.id } });
  });
});
