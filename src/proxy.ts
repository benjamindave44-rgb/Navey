import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Runs before every page render, so it is the cheapest place to stop work that
 * should never have started.
 *
 * A burst of roughly ten requests a second for `/explore?city=<somewhere with
 * no listings>` spent most of a month's server allowance in two days. Each one
 * made four database round trips and rendered a full page in order to say
 * "nothing here". robots.txt already asks crawlers to leave filtered URLs
 * alone; this is for the ones that do not ask.
 */

/** Requests to a filtered /explore one address may make per WINDOW_MS.
 *  Deliberately far above human use -- filter links do not prefetch, so a
 *  person clicking quickly makes a few of these a minute, not forty in ten
 *  seconds. Only filtered Explore is counted: it is where the flood lands, it
 *  is the most expensive page to render, and nothing else is worth the risk of
 *  turning away a real visitor. */
const BURST_LIMIT = 40;
const WINDOW_MS = 10_000;

/** Held per running instance rather than in the database on purpose. A shared
 *  counter would mean a network call on every request, which is the cost being
 *  avoided. Traffic spreads over a few warm instances, so a flood gets through
 *  at roughly this limit times that number -- still far below what was
 *  happening, and it costs nothing at all when nobody is flooding. */
const hits = new Map<string, { count: number; resetAt: number }>();

function overBurstLimit(key: string, now: number): boolean {
  const entry = hits.get(key);
  if (!entry || now > entry.resetAt) {
    // Sweep expired addresses so a long-lived instance cannot grow without
    // bound. Only walks the map once it is already large.
    if (hits.size > 5_000) {
      for (const [k, v] of hits) if (now > v.resetAt) hits.delete(k);
    }
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > BURST_LIMIT;
}

function clientKey(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return (
    forwarded?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

/** Supabase keeps the session in `sb-<project>-auth-token`, split across
 *  `...auth-token.0` and `.1` when it is long. No such cookie means nobody is
 *  signed in, so asking Supabase who the user is would be a network round trip
 *  to be told nothing -- which is every request a crawler has ever made. */
function hasSessionCookie(request: NextRequest): boolean {
  return request.cookies
    .getAll()
    .some(
      (cookie) =>
        cookie.name.startsWith("sb-") && cookie.name.includes("auth-token")
    );
}

export async function proxy(request: NextRequest) {
  const isFilteredExplore =
    request.nextUrl.pathname === "/explore" &&
    request.nextUrl.search.length > 0;

  if (isFilteredExplore && overBurstLimit(clientKey(request), Date.now())) {
    return new NextResponse("Too many requests", {
      status: 429,
      headers: { "retry-after": "60", "cache-control": "no-store" },
    });
  }

  const response = NextResponse.next({ request });

  // Signed out: nothing to refresh, and the work below is a network call.
  if (!hasSessionCookie(request)) return response;

  let sessionResponse = response;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          sessionResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            sessionResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh the session if it exists; this keeps the auth cookie valid.
  await supabase.auth.getUser();

  return sessionResponse;
}

/**
 * Anything listed here skips this file entirely, and skipping it is not just
 * cheaper -- it is one fewer billed invocation, because the proxy is counted
 * separately from the page it runs in front of. Crawlers hit the sitemap,
 * robots.txt and the icons constantly, and not one of those requests has ever
 * carried a session worth refreshing.
 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|opengraph-image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|webmanifest)$).*)",
  ],
};
