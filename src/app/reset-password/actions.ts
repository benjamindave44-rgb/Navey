"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function updatePassword(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      `/forgot-password?error=${encodeURIComponent(
        "Your reset link expired. Please request a new one."
      )}`
    );
  }

  if (password.length < 8) {
    redirect(
      `/reset-password?error=${encodeURIComponent(
        "Password must be at least 8 characters."
      )}`
    );
  }
  if (password !== confirm) {
    redirect(
      `/reset-password?error=${encodeURIComponent("Passwords don't match.")}`
    );
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    redirect(`/reset-password?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/reset-password?done=1");
}
