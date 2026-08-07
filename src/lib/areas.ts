import { supabase } from "@/lib/supabase";
import { slugify } from "@/lib/slug";
import { memo } from "@/lib/memo";

/**
 * Neighbourhoods, sitting under cities.
 *
 * "Coffee shops in BGC" is a search; "coffee shops in Taguig" mostly is not,
 * even though BGC is in Taguig. City pages answer the second and cannot answer
 * the first, because a page has one title and one heading.
 *
 * These are a level below city rather than a parallel set of URLs. A listing
 * appears on its city page whether or not it has a district, so nothing is
 * lost while districts are still being filled in, and the two pages sit in a
 * hierarchy -- Taguig links down to BGC, BGC links back up -- rather than
 * competing for the same search.
 */
export type AreaEntry = {
  district: string;
  city: string;
  /** URL segments. The city is part of the address because district names are
   *  not unique in the Philippines -- Makati has a Poblacion and so does
   *  Nasugbu, and a single /area/poblacion would silently merge two different
   *  places into one page. Including the city keeps every slug stable forever,
   *  rather than only until the day a second town collides with the first. */
  citySlug: string;
  districtSlug: string;
  count: number;
};

export function areaPath(entry: { citySlug: string; districtSlug: string }): string {
  return `/area/${entry.citySlug}/${entry.districtSlug}`;
}

export async function getAreaDirectory(): Promise<AreaEntry[]> {
  return memo("area-directory", async () => {
    const { data, error } = await supabase
      .from("spots")
      .select("district, city")
      .eq("status", "approved")
      .not("district", "is", null);

    if (error || !data) return [];

    const counts = new Map<string, AreaEntry>();
    for (const spot of data) {
      const district = spot.district?.trim();
      if (!district) continue;
      const districtSlug = slugify(district);
      const citySlug = slugify(spot.city ?? "");
      if (!districtSlug || !citySlug) continue;

      const key = `${citySlug}/${districtSlug}`;
      const existing = counts.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        counts.set(key, {
          district,
          city: spot.city,
          citySlug,
          districtSlug,
          count: 1,
        });
      }
    }

    return [...counts.values()].sort(
      (a, b) => b.count - a.count || a.district.localeCompare(b.district)
    );
  });
}

export async function findArea(
  citySlug: string,
  districtSlug: string
): Promise<AreaEntry | null> {
  const directory = await getAreaDirectory();
  return (
    directory.find(
      (entry) =>
        entry.citySlug === citySlug && entry.districtSlug === districtSlug
    ) ?? null
  );
}

/** The neighbourhoods inside one city, for linking down from its page. */
export async function getAreasInCity(city: string): Promise<AreaEntry[]> {
  const directory = await getAreaDirectory();
  return directory.filter((entry) => entry.city === city);
}
