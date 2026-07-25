"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { uploadClaimProof } from "@/lib/photo-upload";

export async function submitBusinessClaim(formData: FormData) {
  const spotId = String(formData.get("spotId") ?? "");
  const claimantName = String(formData.get("claimantName") ?? "").trim();
  const claimantEmail = String(formData.get("claimantEmail") ?? "").trim();

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");
  if (!spotId) redirect("/explore");

  if (!claimantName || !claimantEmail) {
    redirect(
      `/spots/${spotId}/claim?error=${encodeURIComponent(
        "Please fill in your name and email."
      )}`
    );
  }

  const { data: spot } = await supabase
    .from("spots")
    .select("id, submitted_by")
    .eq("id", spotId)
    .eq("status", "approved")
    .maybeSingle();

  if (!spot) redirect("/explore");
  if (spot.submitted_by === user.id) redirect(`/spots/${spotId}`);

  const { data: claim, error } = await supabase
    .from("business_claims")
    .insert({
      spot_id: spotId,
      claimant_id: user.id,
      claimant_name: claimantName,
      claimant_email: claimantEmail,
    })
    .select("id")
    .single();

  if (error || !claim) {
    const message =
      error?.code === "23505"
        ? "You already have a pending claim for this spot."
        : "Something went wrong submitting your claim.";
    redirect(`/spots/${spotId}/claim?error=${encodeURIComponent(message)}`);
  }

  const proofPath = await uploadClaimProof(
    supabase,
    formData.get("proof"),
    `claims/${claim.id}`
  );
  if (proofPath) {
    await supabase
      .from("business_claims")
      .update({ proof_path: proofPath })
      .eq("id", claim.id);
  }

  redirect(`/spots/${spotId}/claim`);
}
