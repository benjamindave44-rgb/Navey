/**
 * A short-lived in-process cache for the small reference lists -- cities,
 * tags, districts -- that nearly every page reads and almost nobody changes.
 *
 * These were fetched fresh on every single request. That is invisible at human
 * traffic and ruinous under a crawler: a flood of pages that each show the same
 * thirty-nine tag chips was thirty-nine tags fetched over the network, every
 * time, for every request.
 *
 * Deliberately in memory rather than in a shared store. The point is to avoid
 * a network round trip, so reaching across the network to a cache would defeat
 * it. Each running instance keeps its own copy and forgets it after TTL_MS, so
 * the worst case for a newly added city or tag is that it takes a minute to
 * appear in the filter lists -- while the listing itself is visible at once,
 * because listings are not cached here.
 */
const TTL_MS = 60_000;

type Entry<T> = { value: Promise<T>; expiresAt: number };

const entries = new Map<string, Entry<unknown>>();

export function memo<T>(key: string, load: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const hit = entries.get(key) as Entry<T> | undefined;
  if (hit && now < hit.expiresAt) return hit.value;

  // Stored before it settles so that a burst of simultaneous requests shares
  // one round trip instead of each starting its own.
  const value = load().catch((error) => {
    // A failed load must not be remembered for a minute, or one blip becomes
    // sixty seconds of blips.
    entries.delete(key);
    throw error;
  });

  entries.set(key, { value, expiresAt: now + TTL_MS });
  return value;
}

/** Drops everything, so a write can make its change visible immediately
 *  instead of waiting out the TTL. */
export function clearMemo() {
  entries.clear();
}
