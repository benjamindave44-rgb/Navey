import { openStatus, manilaNow, type OpenHourRow } from "../src/lib/open-status.ts";

let failures = 0;
function check(label: string, actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual), e = JSON.stringify(expected);
  if (a !== e) { console.error(`FAIL ${label}\n  got      ${a}\n  expected ${e}`); failures++; }
  else console.log(`ok   ${label}`);
}

const row = (
  day: number, open: string | null, close: string | null,
  extra: Partial<OpenHourRow> = {}
): OpenHourRow => ({
  day_of_week: day, open_time: open, close_time: close,
  is_closed: false, is_24_hours: false, ...extra,
});

// All seven days the same, unless overridden.
const everyDay = (open: string | null, close: string | null, extra: Partial<OpenHourRow> = {}) =>
  Array.from({ length: 7 }, (_, d) => row(d, open, close, extra));

// UTC instants; Manila is UTC+8 with no daylight saving.
const at = (iso: string) => new Date(iso);

// --- the timezone trap -------------------------------------------------
// 2026-08-07T01:00Z is 09:00 Friday in Manila.
check("reads Manila, not the server clock", manilaNow(at("2026-08-07T01:00:00Z")), { day: 5, minutes: 540 });
// 2026-08-07T17:00Z is 01:00 *Saturday* in Manila -- a different day.
check("crosses into the next Manila day", manilaNow(at("2026-08-07T17:00:00Z")), { day: 6, minutes: 60 });

const nineToNine = everyDay("9:00 AM", "9:00 PM");
check("open during the day", openStatus(nineToNine, at("2026-08-07T04:00:00Z")), "open");   // 12:00 Fri
check("shut before opening", openStatus(nineToNine, at("2026-08-06T23:00:00Z")), "closed"); // 07:00 Fri
check("shut after closing", openStatus(nineToNine, at("2026-08-07T14:00:00Z")), "closed");  // 22:00 Fri
check("open exactly at opening", openStatus(nineToNine, at("2026-08-07T01:00:00Z")), "open");   // 09:00
check("shut exactly at closing", openStatus(nineToNine, at("2026-08-07T13:00:00Z")), "closed"); // 21:00

// Without the timezone fix this would be "closed": 22:00 UTC looks like night.
check("evening in Manila is not night in UTC", openStatus(nineToNine, at("2026-08-07T09:00:00Z")), "open"); // 17:00

// --- Angkan's real hours: 6:00 AM to 2:00 AM ---------------------------
const angkan = everyDay("6:00 AM", "2:00 AM");
check("overnight: open at midday", openStatus(angkan, at("2026-08-07T04:00:00Z")), "open");    // 12:00
check("overnight: open at 11pm", openStatus(angkan, at("2026-08-07T15:00:00Z")), "open");      // 23:00
check("overnight: still open at 1am", openStatus(angkan, at("2026-08-07T17:00:00Z")), "open"); // 01:00 next day
check("overnight: shut at 3am", openStatus(angkan, at("2026-08-07T19:00:00Z")), "closed");     // 03:00
check("overnight: shut at 5am", openStatus(angkan, at("2026-08-07T21:00:00Z")), "closed");     // 05:00

// Shut today, but last night's hours run into this morning.
const shutSatOpenFri = [
  ...everyDay("6:00 PM", "2:00 AM").filter((r) => r.day_of_week !== 6),
  row(6, null, null, { is_closed: true }),
];
check("yesterday's late night beats today's closed",
  openStatus(shutSatOpenFri, at("2026-08-07T17:00:00Z")), "open"); // 01:00 Sat

// --- the honest unknowns ----------------------------------------------
check("no hours at all shows nothing", openStatus([], at("2026-08-07T04:00:00Z")), "unknown");
check("null hours shows nothing", openStatus(null, at("2026-08-07T04:00:00Z")), "unknown");
check("unreadable times show nothing",
  openStatus(everyDay("sometime", "later"), at("2026-08-07T04:00:00Z")), "unknown");
check("blank times show nothing, not Closed",
  openStatus(everyDay(null, null), at("2026-08-07T04:00:00Z")), "unknown");
check("a missing day shows nothing",
  openStatus([row(0, "9:00 AM", "5:00 PM")], at("2026-08-07T04:00:00Z")), "unknown"); // Friday absent

// --- flags -------------------------------------------------------------
check("24 hours is always open",
  openStatus(everyDay(null, null, { is_24_hours: true }), at("2026-08-07T19:00:00Z")), "open");
check("closed day is closed",
  openStatus(everyDay(null, null, { is_closed: true }), at("2026-08-07T04:00:00Z")), "closed");
check("closed beats 24 hours",
  openStatus(everyDay(null, null, { is_closed: true, is_24_hours: true }), at("2026-08-07T04:00:00Z")), "closed");

// Legacy unpadded format still in the table.
check("legacy 7:00AM parses",
  openStatus(everyDay("7:00AM", "9:00PM"), at("2026-08-07T04:00:00Z")), "open");

console.log(failures === 0 ? "\nAll checks passed" : `\n${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
