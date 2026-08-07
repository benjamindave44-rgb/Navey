"use server";

import { redirect } from "next/navigation";
import { publishChanges } from "@/lib/publish";
import { checkContentGuidelines } from "@/lib/content-guidelines";
import { withinRateLimit } from "@/lib/rate-limit";
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

  if (!(await withinRateLimit("review", { limit: 15, windowSeconds: 3600 }))) {
    redirect(
      `/spots/${spotId}/review?error=${encodeURIComponent(
        "That's a lot of reviews at once. Try again in an hour."
      )}`
    );
  }

  // Same keyword screen the spot forms use: it doesn't block anything, it
  // just routes the obviously bad to an admin for a human look.
  const needsReview =
    checkContentGuidelines({ name: "", description: body || null }).length > 0;

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
      .update({ rating, body: body || null, needs_review: needsReview })
      .eq("id", existing.id);
  } else {
    const { data: inserted } = await supabase
      .from("reviews")
      .insert({
        spot_id: spotId,
        user_id: user.id,
        rating,
        body: body || null,
        needs_review: needsReview,
      })
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

  await publishChanges();
  redirect(`/spots/${spotId}`);
}
