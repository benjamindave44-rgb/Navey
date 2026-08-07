import { orderTagsForCards } from "../src/lib/tag-priority.ts";

let failures = 0;
function check(label: string, actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual), e = JSON.stringify(expected);
  if (a !== e) { console.error(`FAIL ${label}\n  got      ${a}\n  expected ${e}`); failures++; }
  else console.log(`ok   ${label}`);
}

const t = (label: string, group: string, sort: number) => ({ label, group, sort });

// A real listing: many tags, heavily weighted to one group.
const busy = [
  t("WiFi", "Practical", 501),
  t("Charging", "Practical", 502),
  t("Cozy", "Vibe", 104),
  t("Chill", "Vibe", 101),
  t("Quiet", "Vibe", 103),
  t("Date Spot", "Good for", 301),
  t("Work Friendly", "Good for", 305),
  t("Local Coffee", "Food & Drink", 414),
  t("Hidden Gems", "Standout", 601),
];

const ordered = orderTagsForCards(busy);
check("card shows one per kind, best first",
  ordered.slice(0, 3), ["Hidden Gems", "Chill", "Date Spot"]);
check("nothing is discarded", ordered.length, busy.length);
check("every original tag survives",
  [...ordered].sort(), busy.map((x) => x.label).sort());

// Three tags from one group must not fill all three slots.
const oneGroup = [t("Cozy", "Vibe", 104), t("Chill", "Vibe", 101), t("Quiet", "Vibe", 103)];
check("within a group, taxonomy order decides",
  orderTagsForCards(oneGroup), ["Chill", "Quiet", "Cozy"]);

// Standout outranks everything, even when it sorts last numerically.
check("Hidden Gems leads",
  orderTagsForCards([t("WiFi", "Practical", 501), t("Hidden Gems", "Standout", 601)])[0],
  "Hidden Gems");

// Practical is the filler, not the headline.
check("Practical yields to Vibe and Good for",
  orderTagsForCards([
    t("WiFi", "Practical", 501),
    t("Chill", "Vibe", 101),
    t("Date Spot", "Good for", 301),
  ]).slice(0, 3),
  ["Chill", "Date Spot", "WiFi"]);

// Unknown groups must not vanish -- a tag added later still shows somewhere.
const withUnknown = orderTagsForCards([t("Chill", "Vibe", 101), t("Ramen", "Newly Added", 900)]);
check("unrecognised group is kept, ranked last", withUnknown, ["Chill", "Ramen"]);

check("empty in, empty out", orderTagsForCards([]), []);

console.log(failures === 0 ? "\nAll checks passed" : `\n${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
