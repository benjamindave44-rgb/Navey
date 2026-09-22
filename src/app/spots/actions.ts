"use server";

import { createServerSupabaseClient } from "@/lib/supabase-server";
import { publishChanges, spotPath } from "@/lib/publish";

/**
 * Every account gets one implicit list so saving is a single tap. Named
 * lists still live in saved_lists alongside it.
 */
const DEFAULT_LIST_NAME = "My Saves";

export type ToggleSaveResult =
  | { status: "saved" }
  | { status: "removed" }
  | { status: "unauthenticated" }
  | { status: "error" };

export async function toggleSaveSpot(spotId: string): Promise<ToggleSaveResult> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { status: "unauthenticated" };

  const { data: existingList } = await supabase
    .from("saved_lists")
    .select("id")
    .eq("user_id", user.id)
    .eq("name", DEFAULT_LIST_NAME)
    .maybeSingle();

  let listId = existingList?.id;
  if (!listId) {
    const { data: created, error } = await supabase
      .from("saved_lists")
      .insert({ user_id: user.id, name: DEFAULT_LIST_NAME })
      .select("id")
      .single();
    if (error || !created) return { status: "error" };
    listId = created.id;
  }

  const { data: alreadySaved } = await supabase
    .from("saved_list_spots")
    .select("spot_id")
    .eq("list_id", listId)
    .eq("spot_id", spotId)
    .maybeSingle();

  if (alreadySaved) {
    const { error } = await supabase
      .from("saved_list_spots")
      .delete()
      .eq("list_id", listId)
      .eq("spot_id", spotId);
    if (error) return { status: "error" };
  } else {
    const { error } = await supabase
      .from("saved_list_spots")
      .insert({ list_id: listId, spot_id: spotId });
    if (error) return { status: "error" };
  }

  // Only the listing whose save count actually changed.
  //
  // This used to refresh the homepage, /explore and /profile as well. Two of
  // those are rendered per request anyway, so refreshing them did nothing; the
  // homepage is cached, so it was rebuilt every time anybody tapped a heart --
  // a public action, repeatable by any visitor, quietly rebuilding pages. Same
  // fault as the one src/lib/publish.ts exists to explain, in a place where a
  // stranger rather than an admin could trigger it.
  await publishChanges(spotPath(spotId));

  return { status: alreadySaved ? "removed" : "saved" };
}

/**
 * Hands over whatever somebody saved before they had an account.
 *
 * One call for the whole list rather than one per spot: this runs at the moment
 * of signing in, and that moment should not cost a server round trip per cafe
 * somebody liked.
 *
 * Ids are not trusted. They are filtered to real, approved listings before
 * anything is written, so a tampered-with browser store cannot make rows
 * pointing at listings that are pending, rejected or imaginary.
 */
export async function importGuestSaves(
  spotIds: string[]
): Promise<{ status: "done"; imported: number } | { status: "error" }> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { status: "error" };

  // Bounded before it reaches the database, matching the cap the browser keeps.
  const wanted = [...new Set(spotIds.filter((id) => typeof id === "string"))].slice(
    0,
    100
  );
  if (wanted.length === 0) return { status: "done", imported: 0 };

  const { data: realSpots } = await supabase
    .from("spots")
    .select("id")
    .eq("status", "approved")
    .in("id", wanted);

  const ids = (realSpots ?? []).map((spot) => spot.id);
  if (ids.length === 0) return { status: "done", imported: 0 };

  const { data: existingList } = await supabase
    .from("saved_lists")
    .select("id")
    .eq("user_id", user.id)
    .eq("name", DEFAULT_LIST_NAME)
    .maybeSingle();

  let listId = existingList?.id;
  if (!listId) {
    const { data: created, error } = await supabase
      .from("saved_lists")
      .insert({ user_id: user.id, name: DEFAULT_LIST_NAME })
      .select("id")
      .single();
    if (error || !created) return { status: "error" };
    listId = created.id;
  }

  // upsert rather than insert: somebody may already have saved one of these
  // from another device, and a duplicate key must not lose the rest of the list.
  const { error } = await supabase
    .from("saved_list_spots")
    .upsert(
      ids.map((spotId) => ({ list_id: listId, spot_id: spotId })),
      { onConflict: "list_id,spot_id" }
    );

  if (error) return { status: "error" };

  // Deliberately no revalidation. Saved lists are read in the browser
  // (src/lib/use-saved-spots.ts), so there is no cached page to correct.
  return { status: "done", imported: ids.length };
}
