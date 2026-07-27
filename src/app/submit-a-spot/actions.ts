"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { uploadPhotos } from "@/lib/photo-upload";
import { geocodeAddress } from "@/lib/geocode";

export async function submitSpot(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const province = String(formData.get("province") ?? "").trim();
  const category = String(formData.get("category") ?? "coffee_shop");
  const priceRange = String(formData.get("priceRange") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const tagIds = formData
    .getAll("tagIds")
    .map((id) => Number(id))
    .filter((id) => Number.isFinite(id));

  if (!name || !address || !city) {
    redirect(
      `/submit-a-spot?error=${encodeURIComponent(
        "Spot name, address, and city are required."
      )}`
    );
  }

  const { data: hiddenGemTag } = await supabase
    .from("tags")
    .select("id")
    .eq("label", "Hidden Gems")
    .maybeSingle();
  const isHiddenGem = hiddenGemTag ? tagIds.includes(hiddenGemTag.id) : false;

  const locationAdjusted = formData.get("locationAdjusted") === "true";
  const manualLat = Number(formData.get("lat"));
  const manualLng = Number(formData.get("lng"));

  const coords =
    locationAdjusted && Number.isFinite(manualLat) && Number.isFinite(manualLng)
      ? { lat: manualLat, lng: manualLng }
      : await geocodeAddress({ address, city, province: province || null });

  const { data: spot, error } = await supabase
    .from("spots")
    .insert({
      name,
      address,
      city,
      province: province || null,
      category,
      price_range: priceRange || null,
      description: description || null,
      submitted_by: user.id,
      hidden_gem: isHiddenGem,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
    })
    .select("id")
    .single();

  if (error || !spot) {
    redirect(
      `/submit-a-spot?error=${encodeURIComponent(
        error?.message ?? "Something went wrong submitting your spot."
      )}`
    );
  }

  if (tagIds.length > 0) {
    await supabase
      .from("spot_tags")
      .insert(tagIds.map((tagId) => ({ spot_id: spot.id, tag_id: tagId })));
  }

  const { urls: photoUrls } = await uploadPhotos(
    supabase,
    formData.getAll("photos"),
    `spots/${spot.id}/gallery`
  );
  if (photoUrls.length > 0) {
    await supabase
      .from("spot_photos")
      .insert(photoUrls.map((url) => ({ spot_id: spot.id, url, kind: "gallery" })));
  }

  redirect(`/submit-a-spot?success=${encodeURIComponent(name)}`);
}
