const DEFAULT_TZ = 'Europe/Kyiv';

export function getWallClockTime(
  date: Date,
  timezone?: string,
): { hours: number; minutes: number } {
  const tz = timezone ?? process.env.TIMEZONE ?? DEFAULT_TZ;

  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    });

    const parts = formatter.formatToParts(date);
    const hours = parseInt(parts.find((p) => p.type === 'hour')?.value ?? '0', 10);
    const minutes = parseInt(parts.find((p) => p.type === 'minute')?.value ?? '0', 10);

    return { hours, minutes };
  } catch {
    return {
      hours: date.getUTCHours(),
      minutes: date.getUTCMinutes(),
    };
  }
}

const WEEKDAY_MAP: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
};

export function getKyivDateParts(date: Date): {
  year: number;
  month: number;
  day: number;
  weekday: number;
} {
  const tz = process.env.TIMEZONE ?? DEFAULT_TZ;
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
  });
  const parts = formatter.formatToParts(date);
  return {
    year: parseInt(parts.find((p) => p.type === 'year')?.value ?? '0', 10),
    month: parseInt(parts.find((p) => p.type === 'month')?.value ?? '0', 10) - 1,
    day: parseInt(parts.find((p) => p.type === 'day')?.value ?? '0', 10),
    weekday: WEEKDAY_MAP[parts.find((p) => p.type === 'weekday')?.value ?? 'Sun'],
  };
}

export function getKyivDayStart(date: Date): Date {
  const parts = getKyivDateParts(date);
  const dateStr = `${parts.year}-${String(parts.month + 1).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}T00:00:00Z`;
  const utcMidnight = new Date(dateStr);
  const wall = getWallClockTime(utcMidnight, DEFAULT_TZ);
  const offsetMs = (wall.hours * 60 + wall.minutes) * 60 * 1000;
  return new Date(utcMidnight.getTime() - offsetMs);
}
