import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

/**
 * The same shop entered twice is the commonest way a directory rots: two
 * pages, two sets of hours, reviews split across both, and no way for a
 * visitor to tell which is real.
 *
 * Name alone is not enough to judge it. A chain genuinely has several
 * branches in one city with identical names, and blocking those would make
 * the directory wrong in the other direction. What makes a duplicate is the
 * same name in the same place, so proximity decides.
 */

/** Roughly a city block. Two branches of anything are further apart than this. */
const SAME_PLACE_METRES = 250;

export function normaliseName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    // Punctuation and spacing vary wildly between entries -- "Joíe Coffee",
    // "joie coffee" and "Joie-Coffee" are one shop.
    .replace(/[^a-z0-9]+/g, "");
}

function metresBetween(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const EARTH_RADIUS_M = 6_371_000;
  const toRad = (degrees: number) => (degrees * Math.PI) / 180;
  const meanLat = toRad((a.lat + b.lat) / 2);
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng) * Math.cos(meanLat);
  return Math.sqrt(dLat * dLat + dLng * dLng) * EARTH_RADIUS_M;
}

export type DuplicateMatch = { id: string; name: string };

/**
 * Returns an existing listing that looks like the same shop, or null.
 * Without coordinates for either side, an identical name in the same city is
 * treated as a duplicate -- that is the safer default, since a listing with
 * no pin is the one a person is least able to tell apart.
 */
export async function findDuplicateSpot(
  supabase: SupabaseClient<Database>,
  {
    name,
    city,
    lat,
    lng,
    excludeId,
  }: {
    name: string;
    city: string;
    lat: number | null;
    lng: number | null;
    excludeId?: string;
  }
): Promise<DuplicateMatch | null> {
  const target = normaliseName(name);
  if (!target) return null;

  const { data } = await supabase
    .from("spots")
    .select("id, name, lat, lng")
    .eq("city", city);

  for (const spot of data ?? []) {
    if (excludeId && spot.id === excludeId) continue;
    if (normaliseName(spot.name) !== target) continue;

    const bothPinned =
      lat != null && lng != null && spot.lat != null && spot.lng != null;

    if (!bothPinned) return { id: spot.id, name: spot.name };

    const distance = metresBetween(
      { lat, lng },
      { lat: spot.lat!, lng: spot.lng! }
    );
    if (distance <= SAME_PLACE_METRES) return { id: spot.id, name: spot.name };
  }

  return null;
}
