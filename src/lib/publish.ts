import { revalidatePath } from "next/cache";
import { clearMemo } from "@/lib/memo";
import { slugify } from "@/lib/slug";

/**
 * Refreshes what a write actually changed.
 *
 * This used to call `revalidatePath("/", "layout")` -- throwing away every
 * cached page on the site after every admin action, from twenty-three call
 * sites. The comment defending it said writes were rare and the site was
 * small. Both were wrong: a listing is added several times a day, and each one
 * meant rebuilding roughly a hundred pages. ISR writes went from 946 to 68,000
 * in a fortnight, and the CPU that went with it was the largest single cost on
 * the project. Adding coffee shops was quietly the most expensive thing anyone
 * could do here.
 *
 * The blunt version was chosen because a hand-written list of paths can be
 * subtly wrong and fail silently. The answer to that is not to rebuild
 * everything -- it is to not depend on the list being complete. Every public
 * page carries its own `revalidate`, so anything omitted here corrects itself
 * shortly afterwards. This call is only what makes a change visible *now*.
 *
 * That reasoning had a hole in it, and it took a user report to find. "Anything
 * omitted corrects itself shortly afterwards" was true when every page
 * refreshed every five minutes. It stopped being true in the same batch of
 * work, which took the timer to a week: a listing left out of this call is now
 * stale for seven days, not for a minute. The two changes are individually
 * sensible and together they meant a newly added coffee shop appeared on its
 * own page immediately and on the homepage grid with no photo -- because the
 * grid had been built moments earlier, between the listing being inserted and
 * its photos being attached, and then held that version for a week.
 *
 * So pass every page that shows this listing, not just the one the writer is
 * about to look at. `spotPaths` below builds that set: four or five paths
 * rather than one, and still nowhere near the hundred the blunt version threw
 * away.
 *
 * Call this only where a write succeeded. A form rejected for a bad value has
 * changed nothing.
 */
export async function publishChanges(...paths: string[]) {
  // Free: in-process, and the reference lists are read constantly.
  clearMemo();

  for (const path of paths) {
    revalidatePath(path);
  }
}

/** The page whoever just saved is about to be looking at. */
export function spotPath(spotId: string): string {
  return `/spots/${spotId}`;
}

/**
 * Every cached page that shows this listing.
 *
 * The homepage and the city and neighbourhood pages all render cards built
 * from the listing's own row -- name, photo, open state -- so a change to the
 * listing makes each of them wrong until it is rebuilt. Explore is absent on
 * purpose: it is rendered per request, so there is nothing cached to correct.
 *
 * Tag pages are absent too, and that is a judgement rather than an oversight.
 * A listing carries several tags, each adding a path, and a tag page is a
 * browsing surface rather than somewhere anybody checks after a save. They
 * catch up on their own timer.
 */
export function spotPaths(spot: {
  id: string;
  city?: string | null;
  district?: string | null;
}): string[] {
  const paths = [spotPath(spot.id), "/"];

  const citySlug = spot.city ? slugify(spot.city) : "";
  if (citySlug) {
    paths.push(`/city/${citySlug}`);

    const districtSlug = spot.district ? slugify(spot.district) : "";
    // A neighbourhood page's address includes its city, because district
    // names repeat across the country -- see src/lib/areas.ts.
    if (districtSlug) paths.push(`/area/${citySlug}/${districtSlug}`);
  }

  return paths;
}
