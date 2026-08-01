import type { Instrumentation } from "next";

/**
 * Next.js replaces a server error with an opaque digest before the browser
 * ever sees it, so a page can be failing for every visitor while nothing
 * anywhere says so. Every outage on this site so far has been found by a
 * person clicking a link and noticing. This is the part that tells us first.
 *
 * Set ERROR_WEBHOOK_URL to a Discord or Slack incoming webhook to switch it
 * on; with it unset the hook stays quiet and costs nothing.
 */

const WEBHOOK = process.env.ERROR_WEBHOOK_URL;

/** Repeats of the same fault are silenced for this long. */
const THROTTLE_MS = 10 * 60 * 1000;
/** Bounds the map on a long-lived server instance. */
const MAX_TRACKED = 200;

const lastSent = new Map<string, number>();

function shouldSend(key: string, now: number): boolean {
  const previous = lastSent.get(key);
  if (previous !== undefined && now - previous < THROTTLE_MS) return false;

  if (lastSent.size >= MAX_TRACKED) {
    // Drop the oldest rather than grow without bound. Insertion order is
    // preserved, so the first key is the least recently added.
    const oldest = lastSent.keys().next();
    if (!oldest.done) lastSent.delete(oldest.value);
  }
  lastSent.set(key, now);
  return true;
}

export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
  context
) => {
  if (!WEBHOOK) return;

  try {
    const message = error instanceof Error ? error.message : String(error);
    const digest =
      typeof error === "object" && error !== null && "digest" in error
        ? String((error as { digest?: unknown }).digest)
        : undefined;

    // Group on the route rather than the full path, so one broken page does
    // not send a message per visitor.
    if (!shouldSend(`${context.routePath}::${message}`, Date.now())) return;

    // Deliberately no request headers: they carry the visitor's session
    // cookie, and a webhook is not a place to put someone's login.
    const lines = [
      `**Navey error** on \`${context.routePath || request.path}\``,
      `${request.method} ${request.path}`,
      `${context.routeType} · ${message}`,
      digest ? `digest: ${digest}` : null,
      `Muted for ${THROTTLE_MS / 60000} min.`,
    ].filter(Boolean);

    const body = lines.join("\n");

    await fetch(WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Discord reads `content`, Slack reads `text`; each ignores the other,
      // so one payload works with whichever the owner sets up.
      body: JSON.stringify({ content: body, text: body }),
    });
  } catch {
    // Reporting a failure must never become a second failure.
  }
};
