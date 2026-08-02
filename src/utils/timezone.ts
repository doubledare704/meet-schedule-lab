const DEFAULT_OFFICE_TIMEZONE = 'Europe/Kyiv';

export const OFFICE_START_MIN = 9 * 60;
export const OFFICE_END_MIN = 19 * 60;
export const OFFICE_SLOT_MINUTES = 30;
export const OFFICE_SLOT_COUNT = (OFFICE_END_MIN - OFFICE_START_MIN) / OFFICE_SLOT_MINUTES;
export const OFFICE_DAY_MINUTES = OFFICE_END_MIN - OFFICE_START_MIN;

const WEEKDAY_MAP: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
};

export function getOfficeTimezone(): string {
  return process.env.OFFICE_TIMEZONE ?? process.env.TIMEZONE ?? DEFAULT_OFFICE_TIMEZONE;
}

export function getDisplayTimezone(): string {
  if (typeof window !== 'undefined') {
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (timezone) return timezone;
    } catch {
      // fall through to office timezone
    }
  }
  return getOfficeTimezone();
}

export function getWallClockTime(
  date: Date,
  timezone?: string,
): { hours: number; minutes: number } {
  const tz = timezone ?? getOfficeTimezone();

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

export function getDateParts(
  date: Date,
  timezone: string,
): {
  year: number;
  month: number;
  day: number;
  weekday: number;
} {
  if (Number.isNaN(date.getTime())) {
    return { year: 0, month: 0, day: 0, weekday: 0 };
  }

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
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

export function getKyivDateParts(
  date: Date,
): {
  year: number;
  month: number;
  day: number;
  weekday: number;
} {
  return getDateParts(date, getOfficeTimezone());
}

function dayStartFromCalendarDate(
  year: number,
  month: number,
  day: number,
  timezone: string,
): Date {
  for (const hour of [0, 6, 12, 18]) {
    const candidate = new Date(Date.UTC(year, month, day, hour));
    const parts = getDateParts(candidate, timezone);
    if (parts.year === year && parts.month === month && parts.day === day) {
      const wall = getWallClockTime(candidate, timezone);
      const offsetMs = (wall.hours * 60 + wall.minutes) * 60 * 1000;
      return new Date(candidate.getTime() - offsetMs);
    }
  }
  const fallback = new Date(Date.UTC(year, month, day, 12));
  const fallbackWall = getWallClockTime(fallback, timezone);
  return new Date(fallback.getTime() - (fallbackWall.hours * 60 + fallbackWall.minutes) * 60 * 1000);
}

export function getDayStart(date: Date, timezone: string): Date {
  const parts = getDateParts(date, timezone);
  return dayStartFromCalendarDate(parts.year, parts.month, parts.day, timezone);
}

export function getKyivDayStart(date: Date): Date {
  return getDayStart(date, getOfficeTimezone());
}

export function getDayStartForCalendarDate(
  year: number,
  month: number,
  day: number,
  timezone: string,
): Date {
  return dayStartFromCalendarDate(year, month, day, timezone);
}

export function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60) % 24;
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

export interface OfficeWindowRow {
  officeMinute: number;
  localMinute: number;
  label: string;
}

export function getOfficeWindow(
  localDayStart: Date,
  displayTimezone: string,
  officeTimezone?: string,
): OfficeWindowRow[] {
  const office = officeTimezone ?? getOfficeTimezone();
  const kyivAtMidnight = getWallClockTime(localDayStart, office);
  const kyivOffsetMin = kyivAtMidnight.hours * 60 + kyivAtMidnight.minutes;

  const rows: OfficeWindowRow[] = [];
  for (let row = 0; row < OFFICE_SLOT_COUNT; row++) {
    const officeMinute = OFFICE_START_MIN + row * OFFICE_SLOT_MINUTES;
    const localMinute = (officeMinute - kyivOffsetMin + 1440) % 1440;
    rows.push({ officeMinute, localMinute, label: formatMinutes(localMinute) });
  }
  return rows;
}

export function officeRowIndexForLocalMinute(
  localMinute: number,
  rows: readonly OfficeWindowRow[],
): number {
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].localMinute === localMinute) return i;
  }
  return -1;
}

export function getNextOfficeSlot(now: Date, officeTimezone?: string): Date {
  const office = officeTimezone ?? getOfficeTimezone();
  const rounded = new Date((Math.floor(now.getTime() / (30 * 60 * 1000)) + 1) * 30 * 60 * 1000);
  const wall = getWallClockTime(rounded, office);
  const minuteOfDay = wall.hours * 60 + wall.minutes;

  if (minuteOfDay < OFFICE_START_MIN) {
    const dayStart = getDayStart(rounded, office);
    return new Date(dayStart.getTime() + OFFICE_START_MIN * 60 * 1000);
  }

  if (minuteOfDay >= OFFICE_END_MIN) {
    const nextDay = new Date(rounded.getTime() + 86400000);
    const dayStart = getDayStart(nextDay, office);
    return new Date(dayStart.getTime() + OFFICE_START_MIN * 60 * 1000);
  }

  return rounded;
}
