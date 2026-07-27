"use server";

import { createServerSupabaseClient } from "@/lib/supabase-server";

export type SubscribeResult = {
  status: "ok" | "invalid" | "duplicate" | "error";
  message: string;
};

export async function subscribeToNewsletter(
  email: string
): Promise<SubscribeResult> {
  const trimmed = email.trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return { status: "invalid", message: "Enter a valid email address." };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("newsletter_subscribers")
    .insert({ email: trimmed });

  if (error) {
    // Unique violation -- already on the list, which isn't a failure worth
    // showing as one.
    if (error.code === "23505") {
      return { status: "duplicate", message: "You're already on the list." };
    }
    return { status: "error", message: "Something went wrong. Try again." };
  }

  return { status: "ok", message: "You're in. Watch your inbox." };
}
