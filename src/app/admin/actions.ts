"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { geocodeAddress } from "@/lib/geocode";
import { hasAnyHours, spotHoursRowsFromForm } from "@/lib/hours";
import { uploadPhotos } from "@/lib/photo-upload";

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

  return supabase;
}

export async function approveSpot(formData: FormData) {
  const supabase = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) await supabase.from("spots").update({ status: "approved" }).eq("id", id);
  redirect("/admin");
}

export async function rejectSpot(formData: FormData) {
  const supabase = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) await supabase.from("spots").update({ status: "rejected" }).eq("id", id);
  redirect("/admin");
}

export async function dismissFlag(formData: FormData) {
  const supabase = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) await supabase.from("spots").update({ needs_review: false }).eq("id", id);
  redirect("/admin");
}

export async function takeSpotOffline(formData: FormData) {
  const supabase = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (id)
    await supabase
      .from("spots")
      .update({ status: "rejected", needs_review: false })
      .eq("id", id);
  redirect("/admin");
}

export async function backfillCoordinates() {
  const supabase = await requireAdmin();

  const { data: spots } = await supabase
    .from("spots")
    .select("id, address, city, province")
    .or("lat.is.null,lng.is.null");

  let updated = 0;
  for (const spot of spots ?? []) {
    const coords = await geocodeAddress({
      address: spot.address,
      city: spot.city,
      province: spot.province,
    });
    if (coords) {
      await supabase
        .from("spots")
        .update({ lat: coords.lat, lng: coords.lng })
        .eq("id", spot.id);
      updated++;
    }
  }

  const total = spots?.length ?? 0;
  redirect(
    `/admin?notice=${encodeURIComponent(
      `Geocoded ${updated} of ${total} spot${total === 1 ? "" : "s"} missing coordinates.`
    )}`
  );
}

export async function approveClaim(formData: FormData) {
  const supabase = await requireAdmin();
  const claimId = String(formData.get("id") ?? "");
  if (!claimId) redirect("/admin/claims");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: claim } = await supabase
    .from("business_claims")
    .select("id, spot_id, claimant_id")
    .eq("id", claimId)
    .maybeSingle();

  if (claim) {
    await supabase
      .from("spots")
      .update({ submitted_by: claim.claimant_id })
      .eq("id", claim.spot_id);

    await supabase
      .from("business_claims")
      .update({
        status: "approved",
        reviewed_at: new Date().toISOString(),
        reviewed_by: user?.id,
      })
      .eq("id", claim.id);

    // Any other pending claims on the same spot no longer make sense
    // now that it has a verified owner.
    await supabase
      .from("business_claims")
      .update({
        status: "rejected",
        reviewed_at: new Date().toISOString(),
        reviewed_by: user?.id,
      })
      .eq("spot_id", claim.spot_id)
      .eq("status", "pending")
      .neq("id", claim.id);
  }

  redirect("/admin/claims");
}

export async function createListingAsAdmin(formData: FormData) {
  const supabase = await requireAdmin();
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
      `/admin/listings/new?error=${encodeURIComponent(
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

  const featured = formData.get("featured") === "on";

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
      status: "approved",
      featured,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
    })
    .select("id")
    .single();

  if (error || !spot) {
    redirect(
      `/admin/listings/new?error=${encodeURIComponent(
        error?.message ?? "Something went wrong creating the listing."
      )}`
    );
  }

  if (tagIds.length > 0) {
    await supabase
      .from("spot_tags")
      .insert(tagIds.map((tagId) => ({ spot_id: spot.id, tag_id: tagId })));
  }

  // The admin form posts the same hour fields as the public one; without this
  // they were read by nobody and silently dropped.
  const newHours = spotHoursRowsFromForm(formData, spot.id);
  if (hasAnyHours(newHours)) {
    await supabase.from("spot_hours").insert(newHours);
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

  redirect(`/admin/listings/new?success=${encodeURIComponent(name)}&spotId=${spot.id}`);
}

export async function updateListing(formData: FormData) {
  const supabase = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin/listings");

  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "");
  const priceRange = String(formData.get("priceRange") ?? "");
  const address = String(formData.get("address") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const province = String(formData.get("province") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const status = String(formData.get("status") ?? "approved");
  const hiddenGem = formData.get("hiddenGem") === "on";
  const needsReview = formData.get("needsReview") === "on";
  const featured = formData.get("featured") === "on";
  const featuredRankRaw = Number(formData.get("featuredRank"));
  const featuredRank = Number.isFinite(featuredRankRaw) ? featuredRankRaw : 0;

  if (!name || !address || !city) {
    redirect(
      `/admin/listings/${id}?error=${encodeURIComponent(
        "Name, address, and city are required."
      )}`
    );
  }

  const { data: existing } = await supabase
    .from("spots")
    .select("address, city, province")
    .eq("id", id)
    .maybeSingle();

  const addressChanged =
    existing &&
    (existing.address !== address ||
      existing.city !== city ||
      existing.province !== (province || null));

  const locationAdjusted = formData.get("locationAdjusted") === "true";
  const manualLat = Number(formData.get("lat"));
  const manualLng = Number(formData.get("lng"));

  const coords =
    locationAdjusted && Number.isFinite(manualLat) && Number.isFinite(manualLng)
      ? { lat: manualLat, lng: manualLng }
      : addressChanged
        ? await geocodeAddress({ address, city, province: province || null })
        : null;

  const { error: updateError } = await supabase
    .from("spots")
    .update({
      name,
      category,
      price_range: priceRange || null,
      address,
      city,
      province: province || null,
      description: description || null,
      status,
      hidden_gem: hiddenGem,
      needs_review: needsReview,
      featured,
      featured_rank: featuredRank,
      ...(coords ? { lat: coords.lat, lng: coords.lng } : {}),
    })
    .eq("id", id);

  if (updateError) {
    redirect(
      `/admin/listings/${id}?error=${encodeURIComponent(
        `Save failed: ${updateError.message}`
      )}`
    );
  }

  await replaceHours(supabase, id, formData);

  redirect(
    `/admin/listings/${id}?notice=${encodeURIComponent("Listing updated.")}`
  );
}

async function replaceHours(
  supabase: Awaited<ReturnType<typeof requireAdmin>>,
  spotId: string,
  formData: FormData
) {
  const rows = spotHoursRowsFromForm(formData, spotId);
  // Nothing filled in means the form was left alone, not that the shop should
  // lose the hours it already had.
  if (!hasAnyHours(rows)) return;
  await supabase.from("spot_hours").delete().eq("spot_id", spotId);
  await supabase.from("spot_hours").insert(rows);
}

export async function deleteListing(formData: FormData) {
  const supabase = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin/listings");

  // Ask for the deleted row back: a delete blocked by row-level security
  // succeeds while removing nothing, so only the returned rows prove it went.
  const { data: deleted, error } = await supabase
    .from("spots")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) {
    redirect(
      `/admin/listings/${id}?error=${encodeURIComponent(
        `Delete failed: ${error.message}`
      )}`
    );
  }

  if (!deleted || deleted.length === 0) {
    redirect(
      `/admin/listings/${id}?error=${encodeURIComponent(
        "Delete did not go through — the listing is still live. Nothing was removed."
      )}`
    );
  }

  redirect(
    `/admin/listings?notice=${encodeURIComponent("Listing permanently deleted.")}`
  );
}

export async function rejectClaim(formData: FormData) {
  const supabase = await requireAdmin();
  const claimId = String(formData.get("id") ?? "");
  if (!claimId) redirect("/admin/claims");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  await supabase
    .from("business_claims")
    .update({
      status: "rejected",
      reviewed_at: new Date().toISOString(),
      reviewed_by: user?.id,
    })
    .eq("id", claimId);

  redirect("/admin/claims");
}
