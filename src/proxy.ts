import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Keeps a signed-in session alive -- and runs on as few requests as possible.
 *
 * This used to run on every request to the site. It is billed as its own
 * invocation, separate from whatever it sits in front of, so a page already
 * built and waiting in the CDN still woke a server up in order to be handed
 * over. Caching the site therefore saved nothing: the meter was read before
 * the cached page was ever reached. Measured on a site with no visitors:
 * 126,000 middleware invocations in twelve hours, one for every request a
 * crawler made.
 *
 * The matcher at the bottom is now the whole defence. Anything not listed
 * there never reaches this file, and a request for one of those pages is
 * served by the CDN with no server involvement at all -- it cannot cost
 * anything, however many times it is asked for.
 *
 * Do not add public pages to that list. The browser keeps the session alive by
 * itself (src/lib/use-viewer.ts refreshes it and writes the cookie), which is
 * exactly what makes leaving them out safe.
 */

/** Supabase keeps the session in `sb-<project>-auth-token`, split across
 *  `...auth-token.0` and `.1` when it is long. No such cookie means nobody is
 *  signed in, so asking Supabase who the user is would be a network round trip
 *  to be told nothing. */
function hasSessionCookie(request: NextRequest): boolean {
  return request.cookies
    .getAll()
    .some(
      (cookie) =>
        cookie.name.startsWith("sb-") && cookie.name.includes("auth-token")
    );
}

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });

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
 * Only the pages that belong to a signed-in person. Everything else -- the
 * homepage, every coffee shop, every city, tag, neighbourhood, collection,
 * Explore and the map -- is deliberately absent.
 */
export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/owner",
    "/owner/:path*",
    "/profile",
    "/profile/:path*",
    "/settings",
    "/settings/:path*",
    "/submit-a-spot",
    "/submit-a-spot/:path*",
    "/sign-in",
    "/sign-in/:path*",
    "/auth/:path*",
    "/forgot-password",
    "/reset-password",
    "/reset-password/confirm",
    // Nested under a public page, so they have to be named one by one rather
    // than caught by a prefix -- /spots/<id> itself must stay off this list.
    "/spots/:id/review",
    "/spots/:id/claim",
  ],
};
