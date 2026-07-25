"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";

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

  if (existing) {
    await supabase
      .from("reviews")
      .update({ rating, body: body || null })
      .eq("id", existing.id);
  } else {
    await supabase
      .from("reviews")
      .insert({ spot_id: spotId, user_id: user.id, rating, body: body || null });
  }

  redirect(`/spots/${spotId}`);
}
