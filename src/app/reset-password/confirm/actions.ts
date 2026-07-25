"use server";

import { redirect } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase-server";

const EXPIRED_LINK_ERROR = encodeURIComponent(
  "That link is invalid or has expired. Please request a new one."
);

export async function confirmRecovery(formData: FormData) {
  const tokenHash = String(formData.get("token_hash") ?? "");
  const type = String(formData.get("type") ?? "recovery") as EmailOtpType;

  if (!tokenHash) {
    redirect(`/forgot-password?error=${EXPIRED_LINK_ERROR}`);
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });

  if (error) {
    redirect(`/forgot-password?error=${EXPIRED_LINK_ERROR}`);
  }

  redirect("/reset-password");
}
