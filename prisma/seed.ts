import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting database seeding...');

  await prisma.notification.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.recurringSeries.deleteMany();
  await prisma.room.deleteMany();
  await prisma.user.deleteMany();

  const rooms = await Promise.all([
    prisma.room.create({
      data: { name: 'Mercury', floor: 1, capacity: 6 },
    }),
    prisma.room.create({
      data: { name: 'Venus', floor: 1, capacity: 4 },
    }),
    prisma.room.create({
      data: { name: 'Mars', floor: 2, capacity: 12 },
    }),
    prisma.room.create({
      data: { name: 'Jupiter', floor: 2, capacity: 8 },
    }),
    prisma.room.create({
      data: { name: 'Saturn', floor: 3, capacity: 15 },
    }),
  ]);
  console.log(`Seeded ${rooms.length} rooms.`);

  const passwordHash = await bcrypt.hash('password123', 10);

  const user1 = await prisma.user.create({
    data: {
      email: 'alex@example.com',
      name: 'Alex Developer',
      passwordHash,
      isEmailVerified: true,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'sarah@example.com',
      name: 'Sarah Product Manager',
      passwordHash,
      isEmailVerified: true,
    },
  });

  console.log('Seeded test users:');
  console.log('   - User 1: alex@example.com / password123');
  console.log('   - User 2: sarah@example.com / password123');

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setHours(11, 30, 0, 0);

  await prisma.booking.create({
    data: {
      roomId: rooms[0].id,
      userId: user1.id,
      startTime: tomorrow,
      endTime: tomorrowEnd,
    },
  });

  console.log('Seeded demo booking for tomorrow (10:00 - 11:30).');
  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
