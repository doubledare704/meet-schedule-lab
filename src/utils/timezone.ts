export function getWallClockTime(
  date: Date,
  timezone?: string,
): { hours: number; minutes: number } {
  const tz = timezone ?? process.env.TIMEZONE ?? 'Europe/Kyiv';

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
