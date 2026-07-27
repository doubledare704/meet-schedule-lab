# meet-schedule-lab

Office meeting room booking web app with interactive weekly schedule grids, slot reservation, and access-controlled cancellations. Built for the UA-Skills Contest.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL 15 via Docker
- **ORM**: Prisma 7 with `@prisma/adapter-pg`
- **Styling**: Tailwind CSS v4
- **Testing**: Vitest

## Current State

Phase 1 (Foundation) is complete:

- Next.js project initialized with TypeScript and Tailwind CSS v4
- Prisma schema defined with `User`, `Room`, `Booking`, `RecurringSeries`, and `Notification` models
- PostgreSQL service configured via `docker-compose.yml` with environment variables loaded from `.env`
- Database seed script creates 5 rooms, 2 test users, and a demo booking
- Prisma client singleton configured with `PrismaPg` adapter in `src/lib/db.ts`

## Prerequisites

- Node.js >= 22
- Docker and Docker Compose
- npm

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Start PostgreSQL:

```bash
docker compose up -d
```

3. Generate Prisma client and run migrations:

```bash
npx prisma generate
npx prisma migrate dev
```

4. Seed the database:

```bash
npm run seed
```

5. Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

Copy `.env.example` to `.env` and adjust values as needed:

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/meetscheduledb?schema=public` |
| `POSTGRES_USER` | PostgreSQL username | `postgres` |
| `POSTGRES_PASSWORD` | PostgreSQL password | `postgres` |
| `POSTGRES_DB` | PostgreSQL database name | `meetscheduledb` |
| `JWT_SECRET` | Secret key for JWT signing | `super-secret-contest-key-change-in-production` |
| `JWT_EXPIRES_IN` | JWT token expiration | `7d` |
| `MAX_ADVANCE_BOOKING_DAYS` | Maximum days in advance for bookings | `60` |
| `OFFICE_TIMEZONE` | Timezone for office hours validation | `Europe/Kyiv` |

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server on `localhost:3000` |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run type-check` | Run TypeScript compiler without emitting |
| `npm run test` | Run Vitest test suite |
| `npm run seed` | Seed database with rooms and test users |

## Test Credentials

After running `npm run seed`:

- **User 1**: `alex@example.com` / `password123`
- **User 2**: `sarah@example.com` / `password123`

## Database Schema

```
User ────┐
         ├── Booking
Room ────┤
         ├── RecurringSeries ──── Booking
         └── Notification
```

Key indexes:
- `bookings`: `[roomId, startTime, endTime]`, `[userId]`
- `rooms`: `[capacity]`
- `notifications`: `[userId, isRead]`

## Planned Features

- Authentication & JWT session management
- Interactive 7-day weekly schedule grid (30-minute slots, 09:00-19:00)
- Room capacity filtering
- Booking creation with overlap validation
- My Reservations dashboard with cancellation
- Recurring weekly bookings with partial conflict resolution
- Server-Sent Events (SSE) notifications
- Mobile-responsive single-day view

## Docker

Run PostgreSQL only:

```bash
docker compose up -d
```

Stop and remove:

```bash
docker compose down
```

Remove volumes (destructive):

```bash
docker compose down -v
```
