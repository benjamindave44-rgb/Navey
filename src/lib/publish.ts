import { revalidatePath } from "next/cache";
import { clearMemo } from "@/lib/memo";

/**
 * Throws away the cached copies of the public pages.
 *
 * Public pages are built once and reused now, so a change to a listing is not
 * visible until those copies are dropped. Without this a newly approved coffee
 * shop, an edited set of opening hours or a new review would sit invisible for
 * up to five minutes; with it, publishing feels immediate, exactly as it did
 * when every page was rebuilt for every visitor.
 *
 * Everything is dropped rather than a careful list of paths. A single listing
 * appears on the homepage, its own page, its city, its neighbourhood and every
 * tag it carries, and getting that list subtly wrong fails silently -- the
 * worst way for a cache to fail. Writes here are rare and the site is small,
 * so rebuilding all of it is much the cheaper mistake.
 *
 * Call this only where a write actually succeeded. A form rejected for a bad
 * value has changed nothing, and rebuilding the site to reflect nothing is the
 * exact waste the caching exists to remove.
 */
export async function publishChanges() {
  clearMemo();
  revalidatePath("/", "layout");
}
