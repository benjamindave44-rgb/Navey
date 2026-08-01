"use server";

import { redirect } from "next/navigation";
import { checkContentGuidelines } from "@/lib/content-guidelines";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { storagePathFromPublicUrl, uploadPhotos } from "@/lib/photo-upload";
import { geocodeAddress } from "@/lib/geocode";
import { UPLOAD_LIMIT_LABEL } from "@/lib/upload-limits";
import { spotHoursRowsFromForm } from "@/lib/hours";

type PhotoKind = "gallery" | "menu";

const PHOTO_LIMITS: Record<PhotoKind, number> = {
  gallery: 12,
  menu: 9,
};

async function requireOwnerAccess(spotId: string) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  const { data: spot } = await supabase
    .from("spots")
    .select("id, submitted_by")
    .eq("id", spotId)
    .maybeSingle();

  if (!spot || spot.submitted_by !== user.id) redirect("/owner");

  return supabase;
}

export async function updateBasicInfo(formData: FormData) {
  const spotId = String(formData.get("spotId") ?? "");
  const supabase = await requireOwnerAccess(spotId);

  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "");
  const priceRange = String(formData.get("priceRange") ?? "");
  const address = String(formData.get("address") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const province = String(formData.get("province") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const locationAdjusted = formData.get("locationAdjusted") === "true";
  const manualLat = Number(formData.get("lat"));
  const manualLng = Number(formData.get("lng"));

  if (!name || !address || !city) {
    redirect(
      `/owner/${spotId}?error=${encodeURIComponent(
        "Name, address, and city are required."
      )}`
    );
  }

  const issues = checkContentGuidelines({ name, description: description || null });
  const needsReview = issues.length > 0;

  const { data: existing } = await supabase
    .from("spots")
    .select("address, city, province")
    .eq("id", spotId)
    .maybeSingle();

  const addressChanged =
    existing &&
    (existing.address !== address ||
      existing.city !== city ||
      existing.province !== (province || null));

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
      needs_review: needsReview,
      ...(coords ? { lat: coords.lat, lng: coords.lng } : {}),
    })
    .eq("id", spotId);

  if (updateError) {
    redirect(
      `/owner/${spotId}?tab=overview&error=${encodeURIComponent(
        `Save failed: ${updateError.message}`
      )}`
    );
  }

  const notice = needsReview
    ? `Saved and live, but flagged for admin review: ${issues.join(" ")}`
    : locationAdjusted && coords
      ? `Saved. Pin updated to ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}.`
      : "Saved.";
  redirect(`/owner/${spotId}?tab=overview&notice=${encodeURIComponent(notice)}`);
}

export async function updateHours(formData: FormData) {
  const spotId = String(formData.get("spotId") ?? "");
  const supabase = await requireOwnerAccess(spotId);

  await supabase.from("spot_hours").delete().eq("spot_id", spotId);

  const { error } = await supabase
    .from("spot_hours")
    .insert(spotHoursRowsFromForm(formData, spotId));

  if (error) {
    redirect(
      `/owner/${spotId}?tab=hours&error=${encodeURIComponent(
        `Save failed: ${error.message}`
      )}`
    );
  }

  redirect(`/owner/${spotId}?tab=hours&notice=${encodeURIComponent("Hours updated.")}`);
}

export async function updatePayments(formData: FormData) {
  const spotId = String(formData.get("spotId") ?? "");
  const supabase = await requireOwnerAccess(spotId);

  await supabase
    .from("spots")
    .update({
      accepts_cash: formData.get("accepts_cash") === "on",
      accepts_qr_ph: formData.get("accepts_qr_ph") === "on",
      accepts_cards: formData.get("accepts_cards") === "on",
      accepts_bank_transfer: formData.get("accepts_bank_transfer") === "on",
    })
    .eq("id", spotId);

  redirect(
    `/owner/${spotId}?tab=payments&notice=${encodeURIComponent(
      "Payment methods updated."
    )}`
  );
}

export async function updateAmenities(formData: FormData) {
  const spotId = String(formData.get("spotId") ?? "");
  const supabase = await requireOwnerAccess(spotId);

  const tagIds = formData
    .getAll("tagIds")
    .map((id) => Number(id))
    .filter((id) => Number.isFinite(id));

  await supabase.from("spot_tags").delete().eq("spot_id", spotId);
  if (tagIds.length > 0) {
    await supabase
      .from("spot_tags")
      .insert(tagIds.map((tagId) => ({ spot_id: spotId, tag_id: tagId })));
  }

  const noiseLevel = String(formData.get("noiseLevel") ?? "").trim();
  const musicStyle = String(formData.get("musicStyle") ?? "").trim();
  const lighting = String(formData.get("lighting") ?? "").trim();
  const seatingStyle = String(formData.get("seatingStyle") ?? "").trim();

  await supabase
    .from("spots")
    .update({
      noise_level: noiseLevel || null,
      music_style: musicStyle || null,
      lighting: lighting || null,
      seating_style: seatingStyle || null,
    })
    .eq("id", spotId);

  redirect(
    `/owner/${spotId}?tab=amenities&notice=${encodeURIComponent(
      "Amenities & Vibe updated."
    )}`
  );
}

async function addSpotPhotos(kind: PhotoKind, formData: FormData) {
  const spotId = String(formData.get("spotId") ?? "");
  const supabase = await requireOwnerAccess(spotId);

  const { count } = await supabase
    .from("spot_photos")
    .select("id", { count: "exact", head: true })
    .eq("spot_id", spotId)
    .eq("kind", kind);

  const max = PHOTO_LIMITS[kind];
  const remaining = max - (count ?? 0);
  if (remaining <= 0) {
    redirect(
      `/owner/${spotId}?tab=${kind}&error=${encodeURIComponent(
        `You've reached the ${max}-photo limit. Remove one first.`
      )}`
    );
  }

  const { urls, failed } = await uploadPhotos(
    supabase,
    formData.getAll("photos"),
    `spots/${spotId}/${kind}`,
    { allowPdf: kind === "menu" }
  );
  const photoUrls = urls.slice(0, remaining);

  if (photoUrls.length > 0) {
    await supabase
      .from("spot_photos")
      .insert(photoUrls.map((url) => ({ spot_id: spotId, url, kind })));
  }

  if (photoUrls.length === 0 && failed > 0) {
    redirect(
      `/owner/${spotId}?tab=${kind}&error=${encodeURIComponent(
        kind === "menu"
          ? `Upload failed. Menus can be JPEG, PNG, WebP or PDF, up to ${UPLOAD_LIMIT_LABEL} altogether.`
          : "Upload failed. Make sure each photo is a JPEG, PNG, or WebP under 5MB, then try again."
      )}`
    );
  }

  const notice =
    failed > 0
      ? `${photoUrls.length} photo${photoUrls.length === 1 ? "" : "s"} added, ${failed} failed (check file type/size).`
      : "Photos updated.";
  redirect(`/owner/${spotId}?tab=${kind}&notice=${encodeURIComponent(notice)}`);
}

async function deleteSpotPhoto(kind: PhotoKind, formData: FormData) {
  const spotId = String(formData.get("spotId") ?? "");
  const photoId = String(formData.get("photoId") ?? "");
  const supabase = await requireOwnerAccess(spotId);

  const { data: photo } = await supabase
    .from("spot_photos")
    .select("id, url")
    .eq("id", photoId)
    .eq("spot_id", spotId)
    .maybeSingle();

  if (photo) {
    const path = storagePathFromPublicUrl(photo.url);
    if (path) await supabase.storage.from("photos").remove([path]);
    await supabase.from("spot_photos").delete().eq("id", photo.id);
  }

  redirect(`/owner/${spotId}?tab=${kind}&notice=${encodeURIComponent("Photo removed.")}`);
}

export async function addMenuPhotos(formData: FormData) {
  await addSpotPhotos("menu", formData);
}

export async function deleteMenuPhoto(formData: FormData) {
  await deleteSpotPhoto("menu", formData);
}

export async function addGalleryPhotos(formData: FormData) {
  await addSpotPhotos("gallery", formData);
}

export async function deleteGalleryPhoto(formData: FormData) {
  await deleteSpotPhoto("gallery", formData);
}
