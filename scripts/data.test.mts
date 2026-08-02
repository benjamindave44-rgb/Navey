import { citySlug } from "../src/lib/slug.ts";
import { normaliseName } from "../src/lib/duplicates.ts";

let failures = 0;
function check(label: string, actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual), e = JSON.stringify(expected);
  if (a !== e) { console.error(`FAIL ${label}\n  got      ${a}\n  expected ${e}`); failures++; }
  else console.log(`ok   ${label}`);
}

// City slugs must be stable: they are public URLs, and two spellings of one
// city must never produce two rival pages.
check("simple", citySlug("Taguig"), "taguig");
check("two words", citySlug("Cebu City"), "cebu-city");
check("stray spacing", citySlug("  Quezon   City  "), "quezon-city");
check("accents folded", citySlug("Poblacón"), "poblacon");
check("punctuation", citySlug("Lapu-Lapu City"), "lapu-lapu-city");
check("case-insensitive", citySlug("MAKATI"), citySlug("makati"));
check("no leading/trailing dashes", citySlug("--Clark--"), "clark");

// Duplicate detection normalises away the ways one shop gets typed twice.
check("spacing/case", normaliseName("Joíe Coffee"), normaliseName("joie  coffee"));
check("punctuation", normaliseName("Joie-Coffee"), normaliseName("Joie Coffee"));
check("distinct shops stay distinct",
  normaliseName("Odd Cafe Makati") === normaliseName("Odd Cafe"), false);
check("empty stays empty", normaliseName("   "), "");

console.log(failures === 0 ? "\nAll checks passed" : `\n${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
