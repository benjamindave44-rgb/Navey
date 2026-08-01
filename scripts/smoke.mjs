#!/usr/bin/env node
/**
 * Checks that the pages a visitor cannot do without are actually working.
 *
 * This exists because every outage so far was found by a person clicking a
 * link. It runs against a real deployment rather than a build, so it catches
 * the failures that only appear with live data -- a database relationship the
 * build cannot know about, an expired key, a page that renders empty.
 *
 * Usage: node scripts/smoke.mjs [baseUrl]
 * Exits non-zero if any check fails, so CI turns red and sends mail.
 */

const BASE = (process.argv[2] ?? process.env.SMOKE_BASE_URL ?? "https://www.navey.co")
  .replace(/\/$/, "");
const TIMEOUT_MS = 20000;

/**
 * `expect` is the important half. A page that returns 200 while rendering an
 * error or an empty grid is still broken, and status alone would call it fine.
 */
const CHECKS = [
  { name: "Homepage", path: "/", expect: ["Navigate good spots"] },
  { name: "Explore", path: "/explore", expect: ["Explore"] },
  { name: "Collections", path: "/collections", expect: [] },
  { name: "Sign in", path: "/sign-in", expect: [] },
  { name: "Sitemap", path: "/sitemap.xml", expect: ["<urlset"] },
  { name: "Robots", path: "/robots.txt", expect: ["Sitemap:"] },
];

async function get(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "navey-smoke" },
      redirect: "follow",
    });
    return { status: response.status, body: await response.text() };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Spot pages are the product, and they are what broke. Rather than pin a spot
 * id that could later be deleted, take whichever ones the sitemap advertises.
 */
async function spotChecks() {
  try {
    const { status, body } = await get(`${BASE}/sitemap.xml`);
    if (status !== 200) return [];
    const paths = [...body.matchAll(/<loc>([^<]*\/spots\/[^<]+)<\/loc>/g)]
      .map((match) => new URL(match[1]).pathname)
      .slice(0, 3);
    return paths.map((path, index) => ({
      name: `Spot page ${index + 1}`,
      path,
      // Every spot page carries this; its absence means the page rendered the
      // error or not-found screen instead of a listing.
      expect: ["Own this business?", "Hours", "Report"],
      anyOf: true,
    }));
  } catch {
    return [];
  }
}

async function run() {
  const checks = [...CHECKS, ...(await spotChecks())];
  const failures = [];

  for (const check of checks) {
    const url = `${BASE}${check.path}`;
    try {
      const { status, body } = await get(url);

      if (status !== 200) {
        failures.push(`${check.name} (${check.path}) returned ${status}`);
        continue;
      }

      const missing = check.expect.filter((text) => !body.includes(text));
      const failed = check.anyOf
        ? missing.length === check.expect.length
        : missing.length > 0;

      if (failed) {
        failures.push(
          `${check.name} (${check.path}) loaded but is missing: ${
            check.anyOf ? check.expect.join(" / ") : missing.join(", ")
          }`
        );
        continue;
      }

      console.log(`  ok   ${check.name} — ${check.path}`);
    } catch (error) {
      failures.push(
        `${check.name} (${check.path}) could not be reached: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  console.log("");
  if (failures.length > 0) {
    console.error(`FAILED ${failures.length} of ${checks.length} checks on ${BASE}`);
    for (const failure of failures) console.error(`  - ${failure}`);
    process.exit(1);
  }

  console.log(`All ${checks.length} checks passed on ${BASE}`);
}

run().catch((error) => {
  console.error("Smoke run crashed:", error);
  process.exit(1);
});
