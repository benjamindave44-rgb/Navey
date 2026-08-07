import { toIso24 } from "./hours.ts";

/**
 * Works out whether a spot is open right now.
 *
 * Three things make this less obvious than it looks:
 *
 * 1. The server runs in UTC and the shops are in Manila, eight hours ahead.
 *    Reading the server's clock would put the badge eight hours out -- wrong
 *    exactly in the evening, when people are looking. The Philippines has no
 *    daylight saving, but the timezone is still named rather than hardcoded
 *    as +8, so this stays correct if that ever changes.
 *
 * 2. Closing times run past midnight. Angkan is 6:00 AM to 2:00 AM, and a
 *    naive "is now between open and close" test reports it shut every hour of
 *    every day. A closing time at or before the opening time means the next
 *    morning, so yesterday's row has to be consulted too.
 *
 * 3. Not knowing is a real answer. A spot with no hours, or hours we cannot
 *    read, returns "unknown" and shows no badge at all. Saying "Closed" to a
 *    visitor because the data is thin sends them somewhere else and costs the
 *    shop a customer -- worse than saying nothing.
 */

export type OpenHourRow = {
  day_of_week: number;
  open_time: string | null;
  close_time: string | null;
  is_closed: boolean;
  is_24_hours: boolean;
};

export type OpenState = "open" | "closed" | "unknown";

const MANILA = "Asia/Manila";

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

/** The day and time in Manila, regardless of where the server thinks it is. */
export function manilaNow(now: Date): { day: number; minutes: number } | null {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: MANILA,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      // h23 so midnight is 00 rather than 24, which would read as tomorrow.
      hourCycle: "h23",
    }).formatToParts(now);

    const get = (type: string) => parts.find((part) => part.type === type)?.value;
    const day = WEEKDAY_INDEX[get("weekday") ?? ""];
    const hour = Number(get("hour"));
    const minute = Number(get("minute"));

    if (day === undefined || !Number.isFinite(hour) || !Number.isFinite(minute)) {
      return null;
    }
    return { day, minutes: hour * 60 + minute };
  } catch {
    return null;
  }
}

/** Minutes since midnight, or null for anything unparseable. */
function toMinutes(value: string | null): number | null {
  const iso = toIso24(value);
  if (!iso) return null;
  const [hour, minute] = iso.split(":").map(Number);
  return hour * 60 + minute;
}

export function openStatus(
  hours: OpenHourRow[] | null | undefined,
  now: Date = new Date()
): OpenState {
  if (!hours || hours.length === 0) return "unknown";

  const clock = manilaNow(now);
  if (!clock) return "unknown";

  const { day, minutes } = clock;
  const rowFor = (which: number) =>
    hours.find((row) => row.day_of_week === which) ?? null;

  // Still open from yesterday: checked first, because a spot can be shut today
  // and yet open right now at 1am on the back of last night's hours.
  const yesterday = rowFor((day + 6) % 7);
  if (yesterday && !yesterday.is_closed && !yesterday.is_24_hours) {
    const opens = toMinutes(yesterday.open_time);
    const closes = toMinutes(yesterday.close_time);
    if (opens !== null && closes !== null && closes <= opens && minutes < closes) {
      return "open";
    }
  }

  const today = rowFor(day);
  if (!today) return "unknown";
  // Closed is checked first, matching describeHours and the save action: a
  // shop that is shut cannot also be open around the clock, and if stray data
  // ever carries both flags, every part of the site should agree on which one
  // wins.
  if (today.is_closed) return "closed";
  if (today.is_24_hours) return "open";

  const opens = toMinutes(today.open_time);
  const closes = toMinutes(today.close_time);
  if (opens === null || closes === null) return "unknown";

  // A closing time at or before the opening time means the following morning.
  if (closes <= opens) return minutes >= opens ? "open" : "closed";

  return minutes >= opens && minutes < closes ? "open" : "closed";
}
