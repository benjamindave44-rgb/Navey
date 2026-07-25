"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    redirect(
      `/forgot-password?error=${encodeURIComponent("Enter your email address.")}`
    );
  }

  // The "Reset Password" email template links to /reset-password/confirm
  // with a token_hash instead of Supabase's default {{ .ConfirmationURL }},
  // so no redirectTo is needed here — see that route for why.
  const supabase = await createServerSupabaseClient();
  await supabase.auth.resetPasswordForEmail(email);

  // Always show the same outcome whether or not the email has an
  // account, so this can't be used to check which emails are registered.
  redirect(`/forgot-password?sent=${encodeURIComponent(email)}`);
}
