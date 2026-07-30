/**
 * Opening hours are stored as free text ("7:00AM", "6:00 AM", "19:00") because
 * owners type them by hand. Search engines need ISO 8601 24-hour times, so
 * anything we hand to schema.org has to be normalised first — an unparseable
 * value makes Google drop the whole openingHoursSpecification silently.
 */
export function toIso24(value: string | null | undefined): string | null {
  if (!value) return null;

  const match = /^\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*$/i.exec(value);
  if (!match) return null;

  let hour = Number(match[1]);
  const minute = match[2] ? Number(match[2]) : 0;
  const meridiem = match[3]?.toLowerCase();

  if (minute > 59) return null;

  if (meridiem) {
    if (hour < 1 || hour > 12) return null;
    if (meridiem === "am") hour = hour === 12 ? 0 : hour;
    else hour = hour === 12 ? 12 : hour + 12;
  } else if (hour > 23) {
    return null;
  }

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

/** What a spot's hours row says, in plain words. */
export function describeHours(hour: {
  is_closed: boolean;
  is_24_hours: boolean;
  open_time: string | null;
  close_time: string | null;
}): string {
  if (hour.is_closed) return "Closed";
  if (hour.is_24_hours) return "Open 24 hours";
  return `${hour.open_time ?? "?"} – ${hour.close_time ?? "?"}`;
}
