"use server";

import { redirect } from "next/navigation";
import { checkContentGuidelines } from "@/lib/content-guidelines";
import { createServerSupabaseClient } from "@/lib/supabase-server";

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

  if (!name || !address || !city) {
    redirect(
      `/owner/${spotId}?error=${encodeURIComponent(
        "Name, address, and city are required."
      )}`
    );
  }

  const issues = checkContentGuidelines({ name, description: description || null });
  const needsReview = issues.length > 0;

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
      needs_review: needsReview,
    })
    .eq("id", spotId);

  const notice = needsReview
    ? `Saved and live, but flagged for admin review: ${issues.join(" ")}`
    : "Saved.";
  redirect(`/owner/${spotId}?tab=overview&notice=${encodeURIComponent(notice)}`);
}

export async function updateHours(formData: FormData) {
  const spotId = String(formData.get("spotId") ?? "");
  const supabase = await requireOwnerAccess(spotId);

  await supabase.from("spot_hours").delete().eq("spot_id", spotId);

  const rows = [];
  for (let day = 0; day < 7; day++) {
    const isClosed = formData.get(`closed_${day}`) === "on";
    const openTime = String(formData.get(`open_${day}`) ?? "").trim();
    const closeTime = String(formData.get(`close_${day}`) ?? "").trim();
    rows.push({
      spot_id: spotId,
      day_of_week: day,
      is_closed: isClosed,
      open_time: isClosed ? null : openTime || null,
      close_time: isClosed ? null : closeTime || null,
    });
  }

  await supabase.from("spot_hours").insert(rows);

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
