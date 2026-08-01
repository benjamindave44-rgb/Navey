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

/**
 * Half-hour choices for the time pickers. Typing times by hand produced
 * "7:00AM" and "6:00 AM" in the same table, and a value that will not parse is
 * dropped from the data search engines read. Picking from a fixed list makes
 * that impossible rather than merely unlikely.
 */
export const TIME_OPTIONS: string[] = (() => {
  const options: string[] = [];
  for (let minutes = 0; minutes < 24 * 60; minutes += 30) {
    const hour24 = Math.floor(minutes / 60);
    const minute = minutes % 60;
    const period = hour24 < 12 ? "AM" : "PM";
    const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
    options.push(`${hour12}:${String(minute).padStart(2, "0")} ${period}`);
  }
  return options;
})();

export type SpotHourRow = {
  spot_id: string;
  day_of_week: number;
  is_closed: boolean;
  is_24_hours: boolean;
  open_time: string | null;
  close_time: string | null;
};

/**
 * Reads the seven days out of a submitted form. Shared by the add form and the
 * owner's Hours tab so the two cannot drift into disagreeing about what a
 * closed day or a 24-hour day looks like.
 */
export function spotHoursRowsFromForm(
  formData: FormData,
  spotId: string
): SpotHourRow[] {
  const rows: SpotHourRow[] = [];

  for (let day = 0; day < 7; day++) {
    const isClosed = formData.get(`closed_${day}`) === "on";
    // "Closed" wins if both somehow arrive -- a shop that is shut cannot also
    // be open around the clock.
    const is24Hours = !isClosed && formData.get(`hours24_${day}`) === "on";
    const keepsTimes = !isClosed && !is24Hours;
    const openTime = String(formData.get(`open_${day}`) ?? "").trim();
    const closeTime = String(formData.get(`close_${day}`) ?? "").trim();

    rows.push({
      spot_id: spotId,
      day_of_week: day,
      is_closed: isClosed,
      is_24_hours: is24Hours,
      open_time: keepsTimes ? openTime || null : null,
      close_time: keepsTimes ? closeTime || null : null,
    });
  }

  return rows;
}

/** Nothing filled in at all means the person skipped hours, not that the shop
 *  is open zero hours -- so there is nothing worth saving. */
export function hasAnyHours(rows: SpotHourRow[]): boolean {
  return rows.some(
    (row) => row.is_closed || row.is_24_hours || row.open_time || row.close_time
  );
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
