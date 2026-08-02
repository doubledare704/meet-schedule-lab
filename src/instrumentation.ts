import { checkBookingExpirations } from '@/services/notification.service';

const POLL_INTERVAL_MS = 30_000;

let started = false;

async function runSweep(): Promise<void> {
  try {
    await checkBookingExpirations();
  } catch {
    // Silently retry on next tick
  }
}

export async function register(): Promise<void> {
  if (started) return;
  started = true;

  await runSweep();
  setInterval(() => {
    void runSweep();
  }, POLL_INTERVAL_MS);
}
