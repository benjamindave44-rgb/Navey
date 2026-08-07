"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import { useViewer } from "@/lib/use-viewer";

/**
 * Which spots the person looking at the page has saved, fetched in the browser.
 *
 * This is the other half of what stopped pages being cached. Asking the server
 * for it meant the same listing grid had to be rebuilt for every visitor, to
 * decide the colour of a heart. Fetched here instead, the grid is identical for
 * everybody and the hearts fill in a moment after it paints.
 *
 * Shared between every heart on the page: one request, however many cards.
 */
let cache: { userId: string; ids: Promise<Set<string>> } | null = null;

function loadFor(userId: string): Promise<Set<string>> {
  if (cache?.userId === userId) return cache.ids;

  const ids = (async () => {
    const supabase = createBrowserSupabaseClient();
    const { data, error } = await supabase
      .from("saved_list_spots")
      .select("spot_id, saved_lists!inner(user_id)")
      .eq("saved_lists.user_id", userId);

    // A failed lookup must not be remembered, or one blip leaves every heart
    // empty until the page is reloaded.
    if (error) {
      cache = null;
      return new Set<string>();
    }
    return new Set((data ?? []).map((row) => row.spot_id));
  })();

  cache = { userId, ids };
  return ids;
}

/** Called after a save or unsave so the next page reads the new state rather
 *  than a list fetched before the change. */
export function forgetSavedSpots() {
  cache = null;
}

/** One instance, so every heart on the page compares against the same object
 *  rather than a fresh empty Set on each render. */
const NONE: ReadonlySet<string> = new Set<string>();

export function useSavedSpots(): { ids: ReadonlySet<string>; ready: boolean } {
  const viewer = useViewer();
  const viewerId = viewer.status === "signed-in" ? viewer.id : null;
  const [loaded, setLoaded] = useState<{ userId: string; ids: Set<string> } | null>(
    null
  );

  useEffect(() => {
    if (!viewerId) {
      cache = null;
      return;
    }

    let active = true;
    loadFor(viewerId).then((ids) => {
      if (active) setLoaded({ userId: viewerId, ids });
    });
    return () => {
      active = false;
    };
  }, [viewerId]);

  // Still working out who this is: report nothing rather than guess wrong,
  // so a heart holds whatever the page gave it instead of flashing empty.
  if (viewer.status === "loading") return { ids: NONE, ready: false };
  if (!viewerId) return { ids: NONE, ready: true };
  if (loaded?.userId === viewerId) return { ids: loaded.ids, ready: true };
  return { ids: NONE, ready: false };
}
