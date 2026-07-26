"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { geocodeAddress } from "@/lib/geocode";

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

  const coords = addressChanged
    ? await geocodeAddress({ address, city, province: province || null })
    : null;

  await supabase
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
      ...(addressChanged ? { lat: coords?.lat ?? null, lng: coords?.lng ?? null } : {}),
    })
    .eq("id", id);

  redirect(
    `/admin/listings/${id}?notice=${encodeURIComponent("Listing updated.")}`
  );
}

export async function deleteListing(formData: FormData) {
  const supabase = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) await supabase.from("spots").delete().eq("id", id);
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
