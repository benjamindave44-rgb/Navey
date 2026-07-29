"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";

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

export async function deleteReview(formData: FormData) {
  const supabase = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const back = String(formData.get("back") ?? "/admin/reviews");
  if (!id) redirect("/admin/reviews");

  // Ask for the row back: a delete blocked by row-level security reports
  // success while removing nothing.
  const { data: deleted, error } = await supabase
    .from("reviews")
    .delete()
    .eq("id", id)
    .select("id");

  if (error || !deleted || deleted.length === 0) {
    redirect(
      `${back}?error=${encodeURIComponent(
        error?.message ?? "Delete didn't go through — the review is still live."
      )}`
    );
  }

  redirect(`${back}?notice=${encodeURIComponent("Review deleted.")}`);
}

/** Keeps the review but clears the flag: reported isn't the same as bad. */
export async function keepReview(formData: FormData) {
  const supabase = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const back = String(formData.get("back") ?? "/admin/reviews");
  if (!id) redirect("/admin/reviews");

  await supabase.from("reviews").update({ needs_review: false }).eq("id", id);
  await supabase.from("review_reports").delete().eq("review_id", id);

  redirect(`${back}?notice=${encodeURIComponent("Review kept and flag cleared.")}`);
}
