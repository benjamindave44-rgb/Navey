"use server";

import { redirect } from "next/navigation";
import { withinRateLimit } from "@/lib/rate-limit";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { uploadPhotos } from "@/lib/photo-upload";
import { geocodeAddress } from "@/lib/geocode";
import { hasAnyHours, spotHoursRowsFromForm } from "@/lib/hours";
import { findDuplicateSpot } from "@/lib/duplicates";

export async function submitSpot(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const province = String(formData.get("province") ?? "").trim();
  const district = String(formData.get("district") ?? "").trim();
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

  // Generous for a person adding places they know; useless to a script.
  if (!(await withinRateLimit("submit_spot", { limit: 10, windowSeconds: 3600 }))) {
    redirect(
      `/submit-a-spot?error=${encodeURIComponent(
        "You've submitted a lot of spots just now. Try again in an hour."
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


  const duplicate = await findDuplicateSpot(supabase, {
    name,
    city,
    lat: coords?.lat ?? null,
    lng: coords?.lng ?? null,
  });
  if (duplicate) {
    redirect(
      `/submit-a-spot?error=${encodeURIComponent(
        `"${duplicate.name}" is already listed at this address in ${city}. Edit that listing instead of adding it twice.`
      )}`
    );
  }

  /**
   * No account: the submission goes through the database function rather than
   * an insert, because `anon` has no permission to write to `spots` at all --
   * see migration 0042. The function forces status to pending, so nothing a
   * stranger sends is public until it is approved here.
   *
   * No photos and no opening hours on this path, deliberately. Photos from
   * someone with no account are the one thing on this form that could put
   * arbitrary content in the project's storage, and a stranger recommending a
   * shop reliably knows its name and street but rarely its seven-day hours.
   * The short form is also the one people finish.
   */
  if (!user) {
    const submitterName = String(formData.get("submitterName") ?? "").trim();
    const submitterEmail = String(formData.get("submitterEmail") ?? "").trim();

    if (!submitterName || !submitterEmail) {
      redirect(
        `/submit-a-spot?error=${encodeURIComponent(
          "Please add your name and email so we can credit you and ask if anything is unclear."
        )}`
      );
    }

    const { data: newId, error: visitorError } = await supabase.rpc(
      "submit_spot_as_visitor",
      {
        p_name: name,
        p_address: address,
        p_city: city,
        p_province: province || null,
        p_district: district || null,
        p_category: category,
        p_price_range: priceRange || null,
        p_description: description || null,
        p_tag_ids: tagIds,
        p_submitter_name: submitterName,
        p_submitter_email: submitterEmail,
        p_lat: coords?.lat ?? null,
        p_lng: coords?.lng ?? null,
      }
    );

    // The function returns null for anything it refused -- a bad value, or an
    // allowance already spent. One message covers both, because telling a
    // flooder which limit they hit only helps them.
    if (visitorError || !newId) {
      redirect(
        `/submit-a-spot?error=${encodeURIComponent(
          "We couldn't save that just now. Check the details and try again in a little while."
        )}`
      );
    }

    redirect(`/submit-a-spot?success=${encodeURIComponent(name)}&guest=1`);
  }

  const { data: spot, error } = await supabase
    .from("spots")
    .insert({
      name,
      address,
      city,
      province: province || null,
      district: district || null,
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

  // Captured here rather than on a second screen: a listing with no hours is
  // half a listing, and most people never went back to add them.
  const hourRows = spotHoursRowsFromForm(formData, spot.id);
  if (hasAnyHours(hourRows)) {
    await supabase.from("spot_hours").insert(hourRows);
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

/**
 * Attaches submissions made before this person had an account.
 *
 * All the work is in the database (claim_visitor_submissions, migration 0042),
 * which matches on the address Supabase holds for the signed-in account rather
 * than on anything the caller passes. That is the whole safety property: you
 * cannot collect somebody else's submissions by typing their email into the
 * form.
 *
 * Returns how many were claimed. Safe to call on every sign-in -- once rows are
 * claimed there is nothing left to match -- and silent on failure, because this
 * runs in the background and a person signing in should never be shown an error
 * about it.
 */
export async function claimVisitorSubmissions(): Promise<number> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.rpc("claim_visitor_submissions");
    if (error || typeof data !== "number") return 0;
    return data;
  } catch {
    return 0;
  }
}
