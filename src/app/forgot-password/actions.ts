"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    redirect(
      `/forgot-password?error=${encodeURIComponent("Enter your email address.")}`
    );
  }

  const headersList = await headers();
  const host = headersList.get("host") ?? "navey.co";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const origin = `${protocol}://${host}`;

  const supabase = await createServerSupabaseClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/confirm`,
  });

  // Always show the same outcome whether or not the email has an
  // account, so this can't be used to check which emails are registered.
  redirect(`/forgot-password?sent=${encodeURIComponent(email)}`);
}
