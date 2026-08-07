"use server";

import { redirect } from "next/navigation";
import { publishChanges } from "@/lib/publish";
import { createServerSupabaseClient } from "@/lib/supabase-server";

async function requireAdmin() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin") redirect("/");

  return { supabase, userId: user.id };
}

export async function createCollection(formData: FormData) {
  const { supabase, userId } = await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!title) {
    redirect(
      `/admin/collections/new?error=${encodeURIComponent("Give the collection a title.")}`
    );
  }

  const { data, error } = await supabase
    .from("collections")
    .insert({ title, description: description || null, curator_id: userId })
    .select("id")
    .single();

  if (error || !data) {
    redirect(
      `/admin/collections/new?error=${encodeURIComponent(
        error?.message ?? "Could not create the collection."
      )}`
    );
  }

  await publishChanges();
  redirect(`/admin/collections/${data.id}`);
}

export async function updateCollection(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!id) redirect("/admin/collections");
  if (!title) {
    redirect(
      `/admin/collections/${id}?error=${encodeURIComponent("Title can't be empty.")}`
    );
  }

  const { error } = await supabase
    .from("collections")
    .update({ title, description: description || null })
    .eq("id", id);

  if (error) {
    redirect(`/admin/collections/${id}?error=${encodeURIComponent(error.message)}`);
  }
  await publishChanges();
  redirect(`/admin/collections/${id}?notice=${encodeURIComponent("Saved.")}`);
}

export async function deleteCollection(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin/collections");

  // Ask for the row back: a delete blocked by row-level security reports
  // success while removing nothing.
  const { data: deleted, error } = await supabase
    .from("collections")
    .delete()
    .eq("id", id)
    .select("id");

  if (error || !deleted || deleted.length === 0) {
    redirect(
      `/admin/collections/${id}?error=${encodeURIComponent(
        error?.message ?? "Delete didn't go through — the collection is still there."
      )}`
    );
  }

  await publishChanges();
  redirect(`/admin/collections?notice=${encodeURIComponent("Collection deleted.")}`);
}

export async function addSpotToCollection(formData: FormData) {
  const { supabase } = await requireAdmin();
  const collectionId = String(formData.get("collectionId") ?? "");
  const spotId = String(formData.get("spotId") ?? "");
  if (!collectionId || !spotId) redirect("/admin/collections");

  // Append to the end rather than fighting over an existing position.
  const { data: existing } = await supabase
    .from("collection_spots")
    .select("rank")
    .eq("collection_id", collectionId)
    .order("rank", { ascending: false })
    .limit(1);

  const { error } = await supabase
    .from("collection_spots")
    .insert({
      collection_id: collectionId,
      spot_id: spotId,
      rank: (existing?.[0]?.rank ?? 0) + 1,
    });

  if (error) {
    redirect(
      `/admin/collections/${collectionId}?error=${encodeURIComponent(error.message)}`
    );
  }
  await publishChanges();
  redirect(
    `/admin/collections/${collectionId}?notice=${encodeURIComponent("Spot added.")}`
  );
}

export async function removeSpotFromCollection(formData: FormData) {
  const { supabase } = await requireAdmin();
  const collectionId = String(formData.get("collectionId") ?? "");
  const spotId = String(formData.get("spotId") ?? "");
  if (!collectionId || !spotId) redirect("/admin/collections");

  await supabase
    .from("collection_spots")
    .delete()
    .eq("collection_id", collectionId)
    .eq("spot_id", spotId);

  await publishChanges();
  redirect(
    `/admin/collections/${collectionId}?notice=${encodeURIComponent("Spot removed.")}`
  );
}

/** Swaps a spot with its neighbour, so order is editable without drag-and-drop. */
export async function moveSpotInCollection(formData: FormData) {
  const { supabase } = await requireAdmin();
  const collectionId = String(formData.get("collectionId") ?? "");
  const spotId = String(formData.get("spotId") ?? "");
  const direction = String(formData.get("direction") ?? "");
  if (!collectionId || !spotId) redirect("/admin/collections");

  const { data: rows } = await supabase
    .from("collection_spots")
    .select("spot_id, rank")
    .eq("collection_id", collectionId)
    .order("rank", { ascending: true });

  if (rows) {
    const index = rows.findIndex((row) => row.spot_id === spotId);
    const swapWith = direction === "up" ? index - 1 : index + 1;

    if (index !== -1 && swapWith >= 0 && swapWith < rows.length) {
      const a = rows[index];
      const b = rows[swapWith];
      await supabase
        .from("collection_spots")
        .update({ rank: b.rank })
        .eq("collection_id", collectionId)
        .eq("spot_id", a.spot_id);
      await supabase
        .from("collection_spots")
        .update({ rank: a.rank })
        .eq("collection_id", collectionId)
        .eq("spot_id", b.spot_id);
    }
  }

  await publishChanges();
  redirect(`/admin/collections/${collectionId}`);
}
