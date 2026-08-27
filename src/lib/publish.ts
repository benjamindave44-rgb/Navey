import { revalidatePath } from "next/cache";
import { clearMemo } from "@/lib/memo";

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
 * Pass the paths the writer would look at immediately after saving, which in
 * practice means the listing they just edited. Everything else can wait a
 * minute; nobody is watching it.
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
