import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  const userId = session.id;
  let notifiedIds = new Set<string>();

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode('event: connected\ndata: {}\n\n'));

      async function checkExpiringBookings() {
        try {
          const now = new Date();
          const in10Min = new Date(now.getTime() + 10 * 60 * 1000);

          const bookings = await db.booking.findMany({
            where: {
              userId,
              startTime: { gte: now, lte: in10Min },
            },
            include: {
              room: { select: { name: true } },
            },
            orderBy: { startTime: 'asc' },
          });

          for (const booking of bookings) {
            if (notifiedIds.has(booking.id)) continue;
            notifiedIds.add(booking.id);

            const minutesUntil = Math.round(
              (booking.startTime.getTime() - now.getTime()) / 60000,
            );

            const data = JSON.stringify({
              bookingId: booking.id,
              roomName: booking.room.name,
              startTime: booking.startTime.toISOString(),
              minutesUntilStart: Math.max(0, minutesUntil),
            });

            controller.enqueue(
              new TextEncoder().encode(`event: booking-expiring\ndata: ${data}\n\n`),
            );
          }

          if (notifiedIds.size > 200) {
            const expiredThreshold = new Date(now.getTime() - 5 * 60 * 1000);
            const activeIds = new Set(
              bookings
                .filter((b) => b.startTime > expiredThreshold)
                .map((b) => b.id),
            );
            notifiedIds = activeIds;
          }
        } catch {
          // Silently retry on next tick
        }
      }

      checkExpiringBookings();
      const interval = setInterval(checkExpiringBookings, 30000);

      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        notifiedIds.clear();
        try {
          controller.close();
        } catch {
          // Stream already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
