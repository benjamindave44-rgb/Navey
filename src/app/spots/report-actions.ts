"use server";

import { withinRateLimit } from "@/lib/rate-limit";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export type ReportResult = { status: "ok" | "duplicate" | "unauthenticated" | "error" };

/**
 * Readers find the content a keyword filter never will, so let them say so.
 * A report only raises the review for an admin's attention -- it never hides
 * anything on its own, which would hand anyone a way to silence honest
 * criticism of their shop.
 */
export async function reportReview(
  reviewId: string,
  reason: string
): Promise<ReportResult> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "unauthenticated" };

  if (!(await withinRateLimit("report_review", { limit: 20, windowSeconds: 3600 }))) {
    return { status: "error" };
  }

  const { error } = await supabase.from("review_reports").insert({
    review_id: reviewId,
    reporter_id: user.id,
    reason: reason.trim() ? reason.trim().slice(0, 300) : null,
  });

  if (error) {
    // Primary key violation: this person already reported this review.
    if (error.code === "23505") return { status: "duplicate" };
    return { status: "error" };
  }

  await supabase.from("reviews").update({ needs_review: true }).eq("id", reviewId);

  return { status: "ok" };
}
