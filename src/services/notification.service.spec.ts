import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { checkBookingExpirations } from './notification.service';
import { db } from '@/lib/db';

const OWNER_ID = '11111111-1111-4111-8111-111111111101';
const NEXT_USER_ID = '11111111-1111-4111-8111-111111111102';
const ROOM_ID = '11111111-1111-4111-8111-111111111111';

const OWNER_NAME = 'Notification Owner';
const NEXT_USER_NAME = 'Next Slot User';

const OWNER_EMAIL = 'notification-owner@example.com';
const NEXT_USER_EMAIL = 'notification-next@example.com';

const SLOT_MS = 30 * 60000;

async function createCurrentBooking(endOffsetMinutes: number) {
  const endTime = new Date(Date.now() + endOffsetMinutes * 60000);
  const startTime = new Date(endTime.getTime() - 3600000);
  return db.booking.create({
    data: {
      roomId: ROOM_ID,
      userId: OWNER_ID,
      title: 'Current slot',
      startTime,
      endTime,
    },
  });
}

async function createNextBooking(startTime: Date) {
  return db.booking.create({
    data: {
      roomId: ROOM_ID,
      userId: NEXT_USER_ID,
      title: 'Next slot',
      startTime,
      endTime: new Date(startTime.getTime() + SLOT_MS),
    },
  });
}

beforeAll(async () => {
  await db.user.createMany({
    data: [
      {
        id: OWNER_ID,
        email: OWNER_EMAIL,
        name: OWNER_NAME,
        passwordHash: 'mock-hash',
        isEmailVerified: true,
      },
      {
        id: NEXT_USER_ID,
        email: NEXT_USER_EMAIL,
        name: NEXT_USER_NAME,
        passwordHash: 'mock-hash',
        isEmailVerified: true,
      },
    ],
  });
  await db.room.create({
    data: { id: ROOM_ID, name: 'Notification Test Room', floor: 1, capacity: 6 },
  });
});

afterAll(async () => {
  await db.notification.deleteMany({ where: { userId: { in: [OWNER_ID, NEXT_USER_ID] } } });
  await db.booking.deleteMany({ where: { roomId: ROOM_ID } });
  await db.room.deleteMany({ where: { id: ROOM_ID } });
  await db.user.deleteMany({
    where: { email: { in: [OWNER_EMAIL, NEXT_USER_EMAIL] } },
  });
});

beforeEach(async () => {
  await db.notification.deleteMany({ where: { userId: { in: [OWNER_ID, NEXT_USER_ID] } } });
  await db.booking.deleteMany({ where: { roomId: ROOM_ID } });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

async function ownerNotifications() {
  return db.notification.findMany({ where: { userId: OWNER_ID } });
}

describe('checkBookingExpirations', () => {
  it('creates a SLOT_ENDING_SOON notification when the adjacent slot is occupied', async () => {
    const current = await createCurrentBooking(5);
    await createNextBooking(current.endTime);

    await checkBookingExpirations();

    const notifications = await ownerNotifications();
    expect(notifications).toHaveLength(1);
    expect(notifications[0].type).toBe('SLOT_ENDING_SOON');
    expect(notifications[0].bookingId).toBe(current.id);
    expect(notifications[0].message).toContain('Notification Test Room');
    expect(notifications[0].message).toContain(NEXT_USER_NAME);
  });

  it('creates no notification when the next slot is empty', async () => {
    await createCurrentBooking(5);

    await checkBookingExpirations();

    expect(await ownerNotifications()).toHaveLength(0);
  });

  it('creates no notification when the next booking is cancelled', async () => {
    const current = await createCurrentBooking(5);
    const next = await createNextBooking(current.endTime);
    await db.booking.delete({ where: { id: next.id } });

    await checkBookingExpirations();

    expect(await ownerNotifications()).toHaveLength(0);
  });

  it('creates no notification when the current booking is cancelled', async () => {
    const current = await createCurrentBooking(5);
    await createNextBooking(current.endTime);
    await db.booking.delete({ where: { id: current.id } });

    await checkBookingExpirations();

    expect(await ownerNotifications()).toHaveLength(0);
  });

  it('creates the notification exactly once across repeated sweeps', async () => {
    const current = await createCurrentBooking(5);
    await createNextBooking(current.endTime);

    await checkBookingExpirations();
    await checkBookingExpirations();

    const notifications = await ownerNotifications();
    expect(notifications).toHaveLength(1);
    expect(notifications[0].bookingId).toBe(current.id);
  });

  it('creates exactly one notification under concurrent sweeps', async () => {
    const current = await createCurrentBooking(5);
    await createNextBooking(current.endTime);

    await Promise.all([checkBookingExpirations(), checkBookingExpirations()]);

    const notifications = await ownerNotifications();
    expect(notifications).toHaveLength(1);
    expect(notifications[0].bookingId).toBe(current.id);
  });

  it('respects the NOTIFY_BEFORE_MINUTES window', async () => {
    vi.stubEnv('NOTIFY_BEFORE_MINUTES', '5');

    const withinWindow = await createCurrentBooking(3);
    await createNextBooking(withinWindow.endTime);
    const outsideWindow = await createCurrentBooking(10);
    await createNextBooking(outsideWindow.endTime);

    await checkBookingExpirations();

    const notifications = await ownerNotifications();
    expect(notifications).toHaveLength(1);
    expect(notifications[0].bookingId).toBe(withinWindow.id);
  });

  it('creates a SLOT_STARTING_SOON notification for an upcoming booking', async () => {
    const startTime = new Date(Date.now() + 5 * 60000);
    const booking = await db.booking.create({
      data: {
        roomId: ROOM_ID,
        userId: OWNER_ID,
        title: 'Upcoming slot',
        startTime,
        endTime: new Date(startTime.getTime() + SLOT_MS),
      },
    });

    await checkBookingExpirations();

    const notifications = await ownerNotifications();
    expect(notifications).toHaveLength(1);
    expect(notifications[0].type).toBe('SLOT_STARTING_SOON');
    expect(notifications[0].bookingId).toBe(booking.id);
    expect(notifications[0].message).toContain('starts in');
  });
});
