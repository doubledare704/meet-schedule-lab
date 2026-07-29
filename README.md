# meet-schedule-lab

Office meeting room booking web app with interactive weekly schedule grids, slot reservation, real-time notifications, and access-controlled cancellations. Built for the UA-Skills Contest.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL 18 via Docker
- **ORM**: Prisma 7 with `@prisma/adapter-pg`
- **Styling**: Tailwind CSS v4
- **Auth**: JWT with HttpOnly cookies
- **Real-time**: Server-Sent Events (SSE)
- **Testing**: Vitest
- **Container**: Docker with healthchecks

## Features

- Authentication (register / login / logout) with JWT-based sessions
- Interactive 7-day weekly schedule grid (30-minute slots, 09:00-19:00 Kyiv)
- Mobile-responsive single-day view with day tabs
- Room capacity filtering
- Booking creation with overlap validation and conflict detection
- Recurring weekly booking series (up to 52 instances) with partial conflict skipping
- My Reservations dashboard with cancellation (single and future-in-series)
- Real-time SSE notifications on booking creation and cancellation
- Responsive layout (mobile / tablet / desktop)

## Prerequisites

- Node.js >= 22
- Docker and Docker Compose (for PostgreSQL)
- npm

## Quick Start (Development)

1. Install dependencies:

```bash
npm install
```

2. Start PostgreSQL:

```bash
docker compose up -d postgres
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

## Quick Start (Docker)

1. Copy environment variables:

```bash
cp .env.example .env
```

2. Run the full stack (app + database) with a single command:

```bash
docker compose up --build -d
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

Copy `.env.example` to `.env` and adjust values as needed:

| Variable | Description | Default |
|---|---|---|
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
|---|---|
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

## Project Structure

```
meet-schedule-lab/
├── prisma/                   # Schema, migrations, seed
├── src/
│   ├── app/                  # Pages & API routes
│   │   ├── (auth)/           # Login / register pages
│   │   ├── schedule/         # 7-day weekly grid
│   │   ├── my-bookings/      # Reservations table
│   │   └── api/              # REST & SSE endpoints
│   ├── components/           # React components
│   │   ├── grid/             # Schedule grid & time indicator
│   │   ├── modals/           # Booking & cancellation modals
│   │   ├── notifications/    # Bell badge & toast drawer
│   │   └── ui/               # Shared UI primitives
│   ├── lib/                  # Prisma client, auth helpers
│   ├── services/             # Business logic layer
│   └── utils/                # Pure helpers & unit tests
├── .env.example
├── docker-compose.yml
├── Dockerfile
└── package.json
```

## Database Schema

```
User ────┐
         ├── Booking
Room ─────┤
         ├── RecurringSeries ──── Booking
         └── Notification
```

Key indexes:
- `bookings`: `[roomId, startTime, endTime]`, `[userId]`
- `rooms`: `[capacity]`
- `notifications`: `[userId, isRead]`

## API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Sign in |
| POST | `/api/auth/logout` | Sign out |
| GET | `/api/auth/me` | Get current session user |
| GET | `/api/rooms` | List rooms (optional `capacity` filter) |
| GET | `/api/bookings` | List bookings (`mine`, `roomId`, `weekStart` filters) |
| POST | `/api/bookings` | Create a booking |
| DELETE | `/api/bookings/[id]` | Cancel a booking (optional `cancelFuture` for series) |
| POST | `/api/bookings/recurring` | Create a recurring weekly series |
| GET | `/api/notifications/sse` | SSE stream of real-time notifications |

## Booking Rules

- Office hours: 09:00 - 19:00 Kyiv time
- Slot increments: 30 minutes
- Minimum duration: 30 minutes
- Maximum advance booking: 60 days
- Past dates and overlapping slots are rejected
- Only the booking owner can cancel
- Recurring series limited to 52 instances; conflicting instances are skipped

## Docker

Start all services:

```bash
docker compose up --build -d
```

Start only PostgreSQL (for local development):

```bash
docker compose up -d postgres
```

Stop and remove:

```bash
docker compose down
```

Remove volumes (destructive):

```bash
docker compose down -v
```

The app service waits for PostgreSQL to be healthy before starting.
