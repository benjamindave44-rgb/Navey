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
 * Pages are discovered from the sitemap rather than pinned by id, so this keeps
 * working as listings come and go.
 *
 * The sitemap is fetched once and shared. Every page here renders on demand,
 * so each request costs real server time -- and on a free tier a monitor that
 * checks too eagerly becomes the thing that exhausts the budget it is meant to
 * protect. One sample of each page type is enough: these are the same code
 * path, so a second one proves nothing the first did not.
 */
function pagesFrom(body, kind, name, expect, anyOf = false) {
  const pattern = new RegExp(`<loc>([^<]*\\/${kind}\\/[^<]+)</loc>`, "g");
  return [...body.matchAll(pattern)]
    .map((match) => new URL(match[1]).pathname)
    .slice(0, 1)
    .map((path) => ({ name, path, expect, anyOf }));
}

/**
 * The sitemap is fetched once and used twice: as a check in its own right, and
 * as the list of real pages to sample. It used to be requested a second time
 * for the check, which is the most expensive single request here -- rebuilding
 * it walks every listing, city, tag, neighbourhood and collection.
 */
function discoveredChecks(body) {
  try {
    return [
      // Absence of these means the page rendered the error or not-found
      // screen rather than a listing.
      ...pagesFrom(body, "spots", "Spot page", ["Own this business?", "Hours", "Report"], true),
      ...pagesFrom(body, "city", "City page", ["Coffee Shops"]),
      ...pagesFrom(body, "tag", "Tag page", ["Philippines"]),
      ...pagesFrom(body, "area", "Area page", ["Coffee Shops"]),
    ];
  } catch {
    return [];
  }
}

async function run() {
  const failures = [];

  let sitemap = "";
  try {
    const response = await get(`${BASE}/sitemap.xml`);
    if (response.status !== 200) {
      failures.push(`Sitemap (/sitemap.xml) returned ${response.status}`);
    } else if (!response.body.includes("<urlset")) {
      failures.push("Sitemap (/sitemap.xml) loaded but is missing: <urlset");
    } else {
      sitemap = response.body;
      console.log("  ok   Sitemap — /sitemap.xml");
    }
  } catch (error) {
    failures.push(
      `Sitemap (/sitemap.xml) could not be reached: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }

  const checks = [...CHECKS, ...discoveredChecks(sitemap)];

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
    console.error(`FAILED ${failures.length} of ${checks.length + 1} checks on ${BASE}`);
    for (const failure of failures) console.error(`  - ${failure}`);
    process.exit(1);
  }

  console.log(`All ${checks.length + 1} checks passed on ${BASE}`);
}

run().catch((error) => {
  console.error("Smoke run crashed:", error);
  process.exit(1);
});
