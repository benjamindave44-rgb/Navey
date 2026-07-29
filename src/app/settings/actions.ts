"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function updateProfileInfo(formData: FormData) {
  const displayName = String(formData.get("displayName") ?? "").trim();
  const handle = String(formData.get("handle") ?? "").trim();

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  if (!displayName) {
    redirect(
      `/settings?error=${encodeURIComponent("Display name is required.")}`
    );
  }

  await supabase
    .from("profiles")
    .update({ display_name: displayName, handle: handle || null })
    .eq("id", user.id);

  redirect(`/settings?notice=${encodeURIComponent("Profile updated.")}`);
}

export async function changePassword(formData: FormData) {
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) redirect("/sign-in");

  if (!currentPassword || !newPassword || !confirmPassword) {
    redirect(
      `/settings?error=${encodeURIComponent(
        "Please fill in all password fields."
      )}`
    );
  }
  if (newPassword.length < 8) {
    redirect(
      `/settings?error=${encodeURIComponent(
        "New password must be at least 8 characters."
      )}`
    );
  }
  if (newPassword !== confirmPassword) {
    redirect(
      `/settings?error=${encodeURIComponent("New passwords don't match.")}`
    );
  }

  // Require the current password before allowing a change, so a hijacked
  // or left-open session alone isn't enough to lock the real owner out.
  const { error: reauthError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (reauthError) {
    redirect(
      `/settings?error=${encodeURIComponent("Current password is incorrect.")}`
    );
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    redirect(`/settings?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/settings?notice=${encodeURIComponent("Password updated.")}`);
}

/**
 * Self-service account deletion.
 *
 * Runs through a database function rather than the admin API, so no
 * service-role key has to exist in this app at all. That function derives the
 * account from the verified session, so this can only ever delete the caller.
 *
 * Submitted spots survive with no contributor -- a listing describes a
 * business, not the person who added it, and removing it would punish the
 * shop for someone else's decision. Reviews, saved lists and claims are the
 * person's own and go with them.
 */
export async function deleteAccount(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  const confirmation = String(formData.get("confirmation") ?? "").trim();
  if (confirmation.toUpperCase() !== "DELETE") {
    redirect(
      `/settings?error=${encodeURIComponent(
        'Type DELETE in the box to confirm you want to remove your account.'
      )}`
    );
  }

  const { error } = await supabase.rpc("delete_own_account");
  if (error) {
    redirect(
      `/settings?error=${encodeURIComponent(
        `Could not delete your account: ${error.message}`
      )}`
    );
  }

  // The session belongs to a row that no longer exists; clear the cookie so
  // the browser isn't left holding a token for a deleted account.
  await supabase.auth.signOut();

  redirect(
    `/?notice=${encodeURIComponent("Your account has been deleted.")}`
  );
}
