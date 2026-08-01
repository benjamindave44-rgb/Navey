import { spotHoursRowsFromForm, hasAnyHours, TIME_OPTIONS, toIso24, describeHours } from "../src/lib/hours.ts";

let failures = 0;
function check(label: string, actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual), e = JSON.stringify(expected);
  if (a !== e) { console.error(`FAIL ${label}\n  got      ${a}\n  expected ${e}`); failures++; }
  else console.log(`ok   ${label}`);
}

// "Same every day" -> 7 identical days
const same = new FormData();
for (let d = 0; d < 7; d++) { same.append(`open_${d}`, "8:00 AM"); same.append(`close_${d}`, "9:00 PM"); }
const sameRows = spotHoursRowsFromForm(same, "S");
check("same: 7 rows", sameRows.length, 7);
check("same: day 3", sameRows[3], { spot_id:"S", day_of_week:3, is_closed:false, is_24_hours:false, open_time:"8:00 AM", close_time:"9:00 PM" });

// "Open 24/7"
const always = new FormData();
for (let d = 0; d < 7; d++) always.append(`hours24_${d}`, "on");
const alwaysRows = spotHoursRowsFromForm(always, "S");
check("24/7: flagged, times cleared", alwaysRows[0], { spot_id:"S", day_of_week:0, is_closed:false, is_24_hours:true, open_time:null, close_time:null });

// Closed beats 24h if both arrive
const both = new FormData();
both.append("closed_0", "on"); both.append("hours24_0", "on"); both.append("open_0", "8:00 AM");
check("closed wins over 24h", spotHoursRowsFromForm(both, "S")[0].is_closed && !spotHoursRowsFromForm(both,"S")[0].is_24_hours, true);
check("closed clears times", spotHoursRowsFromForm(both, "S")[0].open_time, null);

// Weekday/weekend split
const split = new FormData();
for (const d of [1,2,3,4,5]) { split.append(`open_${d}`, "7:00 AM"); split.append(`close_${d}`, "8:00 PM"); }
for (const d of [0,6]) { split.append(`open_${d}`, "9:00 AM"); split.append(`close_${d}`, "10:00 PM"); }
const splitRows = spotHoursRowsFromForm(split, "S");
check("split: Monday", splitRows[1].open_time, "7:00 AM");
check("split: Sunday", splitRows[0].open_time, "9:00 AM");

// Skipped -> nothing worth saving
check("skip: nothing to save", hasAnyHours(spotHoursRowsFromForm(new FormData(), "S")), false);
check("same: worth saving", hasAnyHours(sameRows), true);
check("24/7: worth saving", hasAnyHours(alwaysRows), true);

// Every dropdown option must survive the trip to schema.org
const unparseable = TIME_OPTIONS.filter((t) => toIso24(t) === null);
check("all 48 options parse for Google", unparseable, []);
check("option count", TIME_OPTIONS.length, 48);
check("first/last", [TIME_OPTIONS[0], TIME_OPTIONS[47]], ["12:00 AM", "11:30 PM"]);
check("midnight -> 00:00", toIso24("12:00 AM"), "00:00");
check("noon -> 12:00", toIso24("12:00 PM"), "12:00");
check("legacy 7:00AM still parses", toIso24("7:00AM"), "07:00");
check("24h reads as open 24 hours", describeHours({is_closed:false,is_24_hours:true,open_time:null,close_time:null}), "Open 24 hours");

console.log(failures === 0 ? "\nAll checks passed" : `\n${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
