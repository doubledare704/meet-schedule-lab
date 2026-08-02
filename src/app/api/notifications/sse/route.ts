import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  const userId = session.id;
  const notifiedIds = new Set<string>();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;

      const close = (): void => {
        if (closed) return;
        closed = true;
        try {
          controller.close();
        } catch {
          // Stream already closed or errored
        }
      };

      const enqueue = (chunk: Uint8Array): void => {
        if (closed) return;
        try {
          controller.enqueue(chunk);
        } catch {
          close();
        }
      };

      enqueue(new TextEncoder().encode('event: connected\ndata: {}\n\n'));

      async function checkUnreadNotifications(): Promise<void> {
        if (closed) return;
        try {
          const notifications = await db.notification.findMany({
            where: { userId, isRead: false },
            orderBy: { createdAt: 'asc' },
          });

          for (const notification of notifications) {
            if (closed) return;
            if (notifiedIds.has(notification.id)) continue;
            notifiedIds.add(notification.id);

            const data = JSON.stringify({
              id: notification.id,
              bookingId: notification.bookingId,
              type: notification.type,
              message: notification.message,
              createdAt: notification.createdAt.toISOString(),
            });

            enqueue(
              new TextEncoder().encode(
                `event: notification\ndata: ${data}\n\n`,
              ),
            );
          }
        } catch {
          // Silently retry on next tick
        }
      }

      void checkUnreadNotifications();
      const interval = setInterval(() => {
        void checkUnreadNotifications();
      }, 30000);

      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        notifiedIds.clear();
        close();
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
