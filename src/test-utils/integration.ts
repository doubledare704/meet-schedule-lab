import { db } from '@/lib/db';

export const TEST_USER_ID = '00000000-0000-0000-0000-000000000001';
export const TEST_ROOM_ID = '00000000-0000-0000-0000-000000000010';
export const TEST_ROOM_2_ID = '00000000-0000-0000-0000-000000000011';
export const TEST_USER_EMAIL = 'integration-test@example.com';

export const TEST_USER = {
  id: TEST_USER_ID,
  email: TEST_USER_EMAIL,
  name: 'Test User',
  passwordHash: 'mock-hash',
};

export const TEST_ROOM = {
  id: TEST_ROOM_ID,
  name: 'Integration Test Room A',
  floor: 1,
  capacity: 6,
};

export const TEST_ROOM_2 = {
  id: TEST_ROOM_2_ID,
  name: 'Integration Test Room B',
  floor: 2,
  capacity: 10,
};

export async function seedTestData(): Promise<void> {
  await db.user.upsert({
    where: { email: TEST_USER_EMAIL },
    create: TEST_USER,
    update: {},
  });
  await db.room.upsert({
    where: { id: TEST_ROOM_ID },
    create: TEST_ROOM,
    update: {},
  });
  await db.room.upsert({
    where: { id: TEST_ROOM_2_ID },
    create: TEST_ROOM_2,
    update: {},
  });
}

export async function cleanupTestData(): Promise<void> {
  await db.booking.deleteMany({
    where: {
      OR: [
        { roomId: TEST_ROOM_ID },
        { roomId: TEST_ROOM_2_ID },
        { userId: TEST_USER_ID },
      ],
    },
  });
  await db.recurringSeries.deleteMany({
    where: { userId: TEST_USER_ID },
  });
  await db.room.deleteMany({
    where: {
      OR: [{ id: TEST_ROOM_ID }, { id: TEST_ROOM_2_ID }],
    },
  });
  await db.user.deleteMany({
    where: { email: TEST_USER_EMAIL },
  });
}

export function futureDate(hoursFromNow: number = 1): Date {
  return new Date(Date.now() + hoursFromNow * 3600000);
}
