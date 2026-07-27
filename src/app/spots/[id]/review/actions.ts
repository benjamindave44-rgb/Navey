"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { uploadPhotos } from "@/lib/photo-upload";

export async function submitReview(formData: FormData) {
  const spotId = String(formData.get("spotId") ?? "");
  const rating = Number(formData.get("rating") ?? 0);
  const body = String(formData.get("body") ?? "").trim();

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");
  if (!spotId) redirect("/explore");

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    redirect(
      `/spots/${spotId}/review?error=${encodeURIComponent(
        "Please select a rating from 1 to 5."
      )}`
    );
  }

  const { data: existing } = await supabase
    .from("reviews")
    .select("id")
    .eq("spot_id", spotId)
    .eq("user_id", user.id)
    .maybeSingle();

  let reviewId = existing?.id;

  if (existing) {
    await supabase
      .from("reviews")
      .update({ rating, body: body || null })
      .eq("id", existing.id);
  } else {
    const { data: inserted } = await supabase
      .from("reviews")
      .insert({ spot_id: spotId, user_id: user.id, rating, body: body || null })
      .select("id")
      .single();
    reviewId = inserted?.id;
  }

  if (reviewId) {
    const { urls: photoUrls } = await uploadPhotos(
      supabase,
      formData.getAll("photos"),
      `reviews/${reviewId}`
    );
    if (photoUrls.length > 0) {
      await supabase
        .from("review_photos")
        .insert(photoUrls.map((url) => ({ review_id: reviewId, url })));
    }
  }

  redirect(`/spots/${spotId}`);
}
