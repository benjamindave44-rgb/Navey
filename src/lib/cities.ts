import { supabase } from "@/lib/supabase";
import { citySlug } from "@/lib/slug";
import { memo } from "@/lib/memo";

/**
 * "Coffee shops in Taguig" is what people actually type, and a filtered
 * Explore URL cannot win it: every filter view carries the same title and
 * description, so search engines see near-duplicates and rank none of them.
 * A city needs its own address, heading and copy to be the answer to that
 * search. These helpers turn the city names already on each listing into
 * those addresses -- no new column, nothing extra to maintain.
 */

export { citySlug };

export type CityEntry = {
  city: string;
  slug: string;
  count: number;
};

/** Every city with at least one approved listing, busiest first. */
export async function getCityDirectory(): Promise<CityEntry[]> {
  return memo("city-directory", async () => {
    const { data, error } = await supabase
      .from("spots")
      .select("city")
      .eq("status", "approved");

    if (error || !data) return [];

    const counts = new Map<string, number>();
    for (const spot of data) {
      const name = spot.city?.trim();
      if (!name) continue;
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }

    return [...counts.entries()]
      .map(([city, count]) => ({ city, slug: citySlug(city), count }))
      .sort((a, b) => b.count - a.count || a.city.localeCompare(b.city));
  });
}

/**
 * Resolves a slug back to the city as it is spelled on the listings, so the
 * page can query and display the real name rather than a de-slugged guess.
 */
export async function findCityBySlug(slug: string): Promise<CityEntry | null> {
  const directory = await getCityDirectory();
  return directory.find((entry) => entry.slug === slug) ?? null;
}
