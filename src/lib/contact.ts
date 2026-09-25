/**
 * Turning what somebody typed into a link that works.
 *
 * A listing with no way to reach the shop is a dead end: the visitor reads it,
 * leaves, and searches Instagram themselves -- which is where they were going
 * to end up anyway, only now without us. These four links are the difference
 * between a page you read and a page you act on.
 *
 * Everything here treats its input as something a person typed into a box at
 * one in the morning, because that is what it is. Handles arrive as
 * "@navey.co", as "instagram.com/navey.co/" and as "navey.co"; websites arrive
 * without a protocol; phone numbers arrive with spaces, dashes and brackets.
 * All of that is normalised on the way out rather than on the way in, so a
 * listing saved before this file existed still produces a working link.
 */

/** Strips the decoration off an Instagram handle, however it was pasted. */
export function instagramHandle(value: string | null | undefined): string | null {
  if (!value) return null;

  let handle = value.trim();
  if (!handle) return null;

  // A pasted profile URL, with or without protocol, query string or trailing
  // slash: instagram.com/navey.co/?hl=en -> navey.co
  handle = handle.replace(/^https?:\/\//i, "");
  handle = handle.replace(/^(?:www\.)?instagram\.com\//i, "");
  handle = handle.split(/[/?#]/)[0] ?? "";
  handle = handle.replace(/^@+/, "").trim();

  // Instagram's own rule: letters, numbers, full stops and underscores, up to
  // thirty characters. Anything else is a typo or a paste of something that
  // was never a handle, and linking to it would give a 404 with our name on
  // it.
  if (!/^[A-Za-z0-9._]{1,30}$/.test(handle)) return null;

  return handle;
}

export function instagramUrl(value: string | null | undefined): string | null {
  const handle = instagramHandle(value);
  return handle ? `https://www.instagram.com/${handle}/` : null;
}

/**
 * A `tel:` link, with the number reduced to digits and a leading plus.
 *
 * Philippine numbers are written every way imaginable -- 0917 123 4567,
 * +63 917 123 4567, (02) 8123 4567 -- and a phone will dial any of them if the
 * punctuation is removed first.
 */
export function telHref(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const digits = trimmed.replace(/[^\d+]/g, "");
  // A plus is only meaningful at the front.
  const normalised = digits.startsWith("+")
    ? `+${digits.slice(1).replace(/\+/g, "")}`
    : digits.replace(/\+/g, "");

  // Shortest sensible landline here is seven digits; longest international
  // number is fifteen, per E.164. Outside that it is not a phone number.
  const bare = normalised.replace(/^\+/, "");
  if (bare.length < 7 || bare.length > 15) return null;

  return `tel:${normalised}`;
}

/**
 * A website link, or nothing.
 *
 * This is the one field on a listing that becomes an href for a stranger to
 * click, so the protocol is checked rather than assumed. `javascript:` and
 * `data:` URLs in an href run in the visitor's browser on our domain; a bare
 * "navey.co" with no protocol resolves as a path on our own site and leads
 * nowhere. Only http and https are allowed through, and anything without a
 * protocol is assumed to be https rather than rejected, because that is what
 * the person meant.
 */
export function websiteUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const url = new URL(candidate);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (!url.hostname.includes(".")) return null;
    return url.toString();
  } catch {
    return null;
  }
}

/** "navey.co" rather than "https://www.navey.co/" -- a link should read as a
 *  place, not as a URL. */
export function websiteLabel(value: string | null | undefined): string | null {
  const url = websiteUrl(value);
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

/**
 * "Get directions" — by name and address, never by coordinates.
 *
 * The first version of this used lat/lng when they existed, on the reasoning
 * that stored coordinates beat an address typed by hand. That was wrong, and
 * the listing page had already said so in a comment that I did not read:
 *
 *   "[coordinates] come from someone tapping a small map, so they land near
 *    the building at best; Google's own record of the shop is the more
 *    accurate destination, and a pin that is merely close sends people to the
 *    wrong door."
 *
 * It did exactly that in practice -- sent people somewhere else entirely.
 * Handing Google the shop's name and address lets it match its own record of
 * the place, which is far better than any pin we hold. The coordinates remain
 * authoritative for the Explore Map, where approximate is the whole point.
 *
 * `/maps/dir/` rather than `/maps/search/`, so the link opens directions from
 * where the person is standing rather than a search result they then have to
 * tap through.
 *
 * Deliberately not stored as a column: it is derived from fields the listing
 * already carries, and a stored copy can drift out of agreement with them.
 */
export function directionsUrl(spot: {
  name: string;
  address?: string | null;
  city?: string | null;
}): string {
  const destination = [spot.name, spot.address, spot.city]
    .filter((part): part is string => Boolean(part && part.trim()))
    .join(", ");

  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    destination
  )}`;
}
