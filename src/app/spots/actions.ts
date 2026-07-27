"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase-server";

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

  revalidatePath("/");
  revalidatePath("/explore");
  revalidatePath("/profile");
  revalidatePath(`/spots/${spotId}`);

  return { status: alreadySaved ? "removed" : "saved" };
}
